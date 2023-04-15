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
  pokemonItem.classList.add("pokemon-item", "list-group-item");
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
  img.classList.add("mr-3"); // Add Bootstrap margin-right class

  const nameSpan = document.createElement("span");
  nameSpan.textContent = `${id} - ${name}`;
  nameSpan.classList.add("align-middle"); // Add Bootstrap vertical alignment class

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

// Save instance data (replace this with the actual API call)
async function saveInstanceData(instanceId) {
  const previousData = await fetchInstance(instanceId);
  console.log(previousData);
  // Update the pokemon_ids in the instance data and save it
  const pokemonIds = getPokemonIds();
  const data = { ...previousData, pokemon_ids: pokemonIds };
  const response = await fetchData(`/api/instance/${instanceId}?password=${getPassword()}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (response.ok) {
    return true;
  } else {
    console.error("Error updating instance data:", response.status);
    return false;
  }
}

function getPokemonIds() {
  const pokemonItems = pokemonList.querySelectorAll(".pokemon-item");
  const ids = [];
  pokemonItems.forEach((item) => ids.push(item.dataset.id));
  return ids;
}

// Fetch instance data (replace this with the actual API call)
async function fetchInstances() {
  const response = await fetchData(`/api/instances?password=${getPassword()}`);

  if (response.ok) {
    const instanceData = await response.json();
    return instanceData;
  } else {
    console.error("Error fetching instance data:", response.status);
    return [];
  }
}

async function fetchInstance(id) {
  const detailsResponse = await fetchData(`/api/instance/${id}?password=${getPassword()}`);
  const detailsData = await detailsResponse.json();
  return JSON.parse(detailsData);
}

async function importPokemonList(pokemonIds) {
  // Update the priority number text area
  const priorityOrderTextArea = document.getElementById("priority-order-text");
  priorityOrderTextArea.value = pokemonIds.join("\n");
  updatePokemonList();
}

async function fetchData(url, options = {}) {
  try {
    const response = await fetch(url, options);
    if (response.status === 401) {
      localStorage.removeItem("password");
      updateLoginState();
      showErrorModal("Failed to authenticate. Please log in again.");
      throw new Error("Unauthorized");
    }

    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }

    return response;
  } catch (error) {
    console.error("Error fetching data:", error);
    throw error;
  }
}

function showErrorModal(message) {
  const errorModalElement = document.getElementById("errorModal");
  const errorModal = new bootstrap.Modal(errorModalElement, {});
  const errorMessage = document.getElementById("errorMessage");

  function close() {
    openedModals.forEach((x) => x.hide());
    errorModal.hide();
    openedModals = [];
  }

  const closeButton = errorModalElement.querySelector(".btn-close");
  closeButton.addEventListener("click", close);

  errorModalElement.querySelector("#close-error-button").addEventListener("click", close);

  errorMessage.textContent = message;
  errorModal.show();
}

function openImportModal() {
  fetchInstances().then((instanceData) => {
    const importModalBody = document.getElementById("importModalBody");
    importModalBody.innerHTML = "";

    instanceData.forEach((instance) => {
      const instanceElement = document.createElement("button");
      instanceElement.textContent = instance.name;
      instanceElement.className = "btn btn-primary m-2";
      instanceElement.onclick = async () => {
        const instancePokemonData = await fetchInstance(instance.id);
        importPokemonList(instancePokemonData.pokemon_ids);
        openedModals = openedModals.filter((x) => x != importModal);
        importModal.hide();
      };

      importModalBody.appendChild(instanceElement);
    });
  });

  const importModal = new bootstrap.Modal(document.getElementById("importModal"));
  importModal.show();
  openedModals.push(importModal);
}

let openedModals = [];

function openSaveModal() {
  fetchInstances().then((instanceData) => {
    const saveModalBody = document.getElementById("saveModalBody");
    saveModalBody.innerHTML = "";

    instanceData.forEach((instance) => {
      const instanceElement = document.createElement("button");
      instanceElement.textContent = instance.name;
      instanceElement.className = "btn btn-primary m-2";
      instanceElement.onclick = () => {
        if (confirm(`Are you sure you want to save to ${instance.name}?`)) {
          saveInstanceData(instance.id);
          openedModals = openedModals.filter((x) => x != saveModal);
          saveModal.hide();
        }
      };

      saveModalBody.appendChild(instanceElement);
    });
  });

  const saveModal = new bootstrap.Modal(document.getElementById("saveModal"));
  saveModal.show();
  openedModals.push(saveModal);
}

function getPassword() {
  return localStorage.getItem("password");
}

// Get the buttons by their id attributes
const importButton = document.getElementById("import-button");
const saveButton = document.getElementById("save-button");

// Add event listeners for the click event
importButton.addEventListener("click", openImportModal);
saveButton.addEventListener("click", openSaveModal);

function updateLoginState() {
  const loginButton = document.getElementById("loginButton");
  const loggedInButtons = document.getElementById("loggedInButtons");
  const password = localStorage.getItem("password");
  if (password) {
    loginButton.style.display = "none";
    loggedInButtons.style.display = "block";
  } else {
    loginButton.style.display = "block";
    loggedInButtons.style.display = "none";
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const loginButton = document.getElementById("loginButton");
  const submitLogin = document.getElementById("submitLogin");
  const loginModalElement = document.getElementById("loginModal");
  const loginModal = new bootstrap.Modal(loginModalElement, {});

  loginButton.addEventListener("click", () => {
    loginModal.show();
  });

  submitLogin.addEventListener("click", () => {
    const passwordInput = document.getElementById("passwordInput");
    const password = passwordInput.value;
    if (password) {
      localStorage.setItem("password", password);
      passwordInput.value = "";
      loginModal.hide();
      updateLoginState();
    } else {
      alert("Please enter a password");
    }
  });

  updateLoginState();

  // Add event listeners for openImportModal and openSaveModal functions
  document.getElementById("importButton").addEventListener("click", openImportModal);
  document.getElementById("saveButton").addEventListener("click", openSaveModal);
});
