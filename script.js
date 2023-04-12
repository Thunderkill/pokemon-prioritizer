const pokemonList = document.getElementById("pokemon-list");
const priorityOrderText = document.getElementById("priority-order-text");
const validationError = document.getElementById("validation-error");
const fixButton = document.getElementById("fix-button");
let pokemonData;

function throttle(func, delay) {
  let lastCall = 0;
  return function (...args) {
    const now = Date.now();
    if (now - lastCall < delay) {
      return;
    }
    lastCall = now;
    return func(...args);
  };
}

async function fetchPokemonData() {
  const response = await fetch("https://pogoapi.net/api/v1/released_pokemon.json");
  const data = await response.json();
  return data;
}

async function createPokemonItems() {
  pokemonData = await fetchPokemonData();
  let position = 1;
  for (const id in pokemonData) {
    const pokemonItem = createPokemonItem(id, pokemonData[id].name);
    const priorityInput = pokemonItem.querySelector(".priority-input");
    priorityInput.value = position;
    position++;
    pokemonList.appendChild(pokemonItem);
  }
  updatePriorityOrder();
}

function createPokemonItem(id, name) {
  const pokemonItem = document.createElement("div");
  pokemonItem.classList.add("pokemon-item");
  pokemonItem.draggable = true;
  pokemonItem.dataset.id = id;

  // Create an input field for the priority number
  const priorityInput = document.createElement("input");
  priorityInput.type = "number";
  priorityInput.min = "1";
  priorityInput.classList.add("priority-input");
  priorityInput.addEventListener("keydown", handlePriorityChange);

  const img = document.createElement("img");
  img.src = `https://images.gameinfo.io/pokemon-trimmed/60/p${id}.webp`;
  img.alt = name;
  img.width = 60;
  img.height = 60;
  img.draggable = false;

  const nameSpan = document.createElement("span");
  nameSpan.textContent = `${id} - ${name}`;

  const container = document.createElement("div");
  container.style.display = "flex";
  container.style.alignItems = "center";

  // Add the priority input field to the left of the image
  container.appendChild(priorityInput);
  container.appendChild(img);
  container.appendChild(nameSpan);

  pokemonItem.appendChild(container);

  pokemonItem.addEventListener("dragstart", handleDragStart);
  pokemonItem.addEventListener("dragover", throttle(handleDragOver, 50));
  pokemonItem.addEventListener("drop", handleDrop);

  return pokemonItem;
}

function handlePriorityChange(e) {
  if (e.key === "Enter") {
    e.preventDefault();

    const priorityInput = e.target;
    const item = priorityInput.closest(".pokemon-item");
    const newPriority = parseInt(priorityInput.value, 10) - 1;
    const currentPriority = Array.from(item.parentElement.children).indexOf(item);

    if (newPriority >= 0 && newPriority < item.parentElement.children.length) {
      item.parentElement.insertBefore(
        item,
        item.parentElement.children[newPriority < currentPriority ? newPriority : newPriority + 1]
      );
      updatePriorityOrder();
    }
    updatePriorityNumbers();
  }
}

createPokemonItems();

function updatePriorityNumbers() {
  const priorityInputs = pokemonList.querySelectorAll(".priority-input");
  priorityInputs.forEach((input, index) => {
    input.value = index + 1;
  });
}

function updatePriorityOrder() {
  const pokemonItems = pokemonList.querySelectorAll(".pokemon-item");
  let order = "";
  pokemonItems.forEach((item) => {
    order += item.dataset.id + "\n";
  });
  priorityOrderText.value = order;
  updatePriorityNumbers();
}

function updatePokemonList() {
  const ids = priorityOrderText.value.trim().split("\n");
  pokemonList.innerHTML = "";
  ids.forEach((id) => {
    if (pokemonData[id]) {
      const pokemonItem = createPokemonItem(id, pokemonData[id].name);
      pokemonList.appendChild(pokemonItem);
    }
  });
  updatePriorityNumbers(); // Add this line
}

function validatePriorityOrder() {
  const ids = priorityOrderText.value.trim().split("\n");
  const idSet = new Set(ids);
  const missingIds = [];
  const extraIds = [];
  const duplicateIds = [];
  const idCounts = {};

  for (const id in pokemonData) {
    if (!idSet.has(id)) {
      missingIds.push(id);
    }
  }

  ids.forEach((id) => {
    if (!pokemonData[id]) {
      extraIds.push(id);
    }
    idCounts[id] = (idCounts[id] || 0) + 1;
  });

  for (const id in idCounts) {
    if (idCounts[id] > 1) {
      duplicateIds.push(id);
    }
  }

  let errorMessage = "";
  if (missingIds.length > 0) {
    errorMessage += `Missing IDs: ${missingIds.join(", ")}\n`;
  }
  if (extraIds.length > 0) {
    errorMessage += `Extra IDs: ${extraIds.join(", ")}\n`;
  }
  if (duplicateIds.length > 0) {
    errorMessage += `Duplicate IDs: ${duplicateIds.join(", ")}`;
  }

  if (errorMessage) {
    validationError.textContent = errorMessage;
    fixButton.style.display = "inline";
  } else {
    validationError.textContent = "";
    fixButton.style.display = "none";
    updatePokemonList();
  }
}

function fixPriorityOrder() {
  const ids = priorityOrderText.value.trim().split("\n");
  const newIds = [];
  const usedIds = new Set();

  ids.forEach((id) => {
    if (pokemonData[id] && !usedIds.has(id)) {
      newIds.push(id);
      usedIds.add(id);
    }
  });

  for (const id in pokemonData) {
    if (!usedIds.has(id)) {
      newIds.push(id);
    }
  }

  priorityOrderText.value = newIds.join("\n");
  updatePokemonList(); // Add this line
  validatePriorityOrder();
}

let placeholder;

function createPlaceholder() {
  placeholder = document.createElement("div");
  placeholder.classList.add("placeholder");
}
createPlaceholder();

let draggedElement;

function handleDragStart(e) {
  e.dataTransfer.setData("text/plain", e.target.dataset.id);
  draggedElement = e.target.closest(".pokemon-item");
  draggedElement.style.opacity = "0.5";

  // Add the following lines to set the drag image to a transparent pixel
  const transparentPixel = new Image();
  transparentPixel.src = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
  e.dataTransfer.setDragImage(transparentPixel, 0, 0);

  // Add the ondragend event listener to reset the opacity and update the priority order
  draggedElement.addEventListener("dragend", resetDraggedElement);
}

function handleDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = "move";

  const target = e.target.closest(".pokemon-item");
  if (!target || target === draggedElement) return;

  const bounding = target.getBoundingClientRect();
  const offset = bounding.y + bounding.height / 2;

  if (e.clientY - offset > 0) {
    target.parentNode.insertBefore(draggedElement, target.nextSibling);
  } else {
    target.parentNode.insertBefore(draggedElement, target);
  }
}

function handleDrop(e) {
  e.preventDefault();
  resetDraggedElement();
}

function resetDraggedElement() {
  if (draggedElement) {
    draggedElement.style.opacity = "1";
    updatePriorityOrder();
    draggedElement.removeEventListener("dragend", resetDraggedElement);
  }
}

priorityOrderText.addEventListener("input", validatePriorityOrder);
fixButton.addEventListener("click", fixPriorityOrder);

function scrollToSearchedItem() {
  const highlightedItems = document.querySelectorAll(".pokemon-item.highlight");
  if (highlightedItems.length > 0) {
    const firstItem = highlightedItems[0];
    const container = firstItem.parentNode;
    const itemRect = firstItem.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    const centerOffset = containerRect.height / 2 - itemRect.height / 2;
    container.scrollTop = firstItem.offsetTop - centerOffset;
  }
}

function handleSearch(e) {
  const searchValue = e.target.value.toLowerCase();
  const pokemonItems = pokemonList.querySelectorAll(".pokemon-item");
  let found = false;

  pokemonItems.forEach((item) => {
    const name = item.querySelector("span").textContent.toLowerCase();
    const id = item.dataset.id;
    if (searchValue && (name.includes(searchValue) || id.includes(searchValue))) {
      item.classList.add("highlight");
      found = true;
    } else {
      item.classList.remove("highlight");
    }
  });

  if (found) {
    scrollToSearchedItem();
  }
}

function copyToClipboard() {
  priorityOrderText.select();
  document.execCommand("copy");
  alert("Priority order copied to clipboard!");
}

const searchBar = document.getElementById("search-bar");
searchBar.addEventListener("input", handleSearch);

const copyButton = document.getElementById("copy-button");
copyButton.addEventListener("click", copyToClipboard);
