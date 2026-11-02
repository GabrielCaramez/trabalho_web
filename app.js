const grid = document.querySelector("#species-grid");
const empty = document.querySelector("#empty-state");
const search = document.querySelector("#search");
let selectedFilter = "Todos";
let currentSpecies = { name: "Tyrannosaurus rex", description: "Grande predador do Cretáceo." };
let searchTimer;
let catalogRequest = 0;

async function loadSpecies() {
  const requestId = ++catalogRequest;
  const params = new URLSearchParams({ limit: "1000", search: search.value, diet: selectedFilter });
  const response = await fetch(`/api/dinosaurs?${params}`);
  if (!response.ok) throw new Error(`Catálogo indisponível (${response.status})`);
  const { items } = await response.json();
  if (requestId !== catalogRequest) return;
  empty.hidden = items.length > 0;
  grid.innerHTML = items.map((item) => `
    <article class="species-card">
      <div class="species-image"><img src="${fallbackImage(item.name)}" alt="Ilustração de ${escapeHtml(item.name)}"><span class="species-tag">${escapeHtml(item.period)}</span></div>
      <div class="species-info"><h3>${escapeHtml(item.name)}</h3><p>${escapeHtml(item.diet)} · ${escapeHtml(item.region)}</p>
      <div class="species-meta"><button class="text-link view-3d" data-name="${encodeURIComponent(item.name)}">Ver em 3D ↗</button><span>♡</span></div></div>
    </article>`).join("");
  grid.querySelectorAll(".view-3d").forEach((button) => button.addEventListener("click", () => {
    const item = items.find((entry) => entry.name === decodeURIComponent(button.dataset.name));
    if (item) selectSpecies(item);
  }));
}

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[character]);
}
function fallbackImage(name) {
  const hue = [...name].reduce((total, character) => total + character.charCodeAt(0), 0) % 360;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 700 400"><defs><linearGradient id="g"><stop stop-color="hsl(${hue} 28% 82%)"/><stop offset="1" stop-color="hsl(${(hue + 35) % 360} 30% 58%)"/></linearGradient></defs><rect width="700" height="400" fill="url(#g)"/><circle cx="560" cy="90" r="52" fill="#f3d982" opacity=".8"/><path d="M125 275 C165 185 260 155 350 205 C410 238 470 195 535 160 L575 178 L530 211 L585 220 L525 237 C460 275 399 286 333 255 L282 320 L248 320 L265 255 L212 250 L186 315 L151 315 L169 239 Z" fill="#173b2e"/><circle cx="510" cy="192" r="6" fill="#f3d982"/><text x="350" y="365" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="18" font-weight="700" fill="#173b2e">${escapeHtml(name)}</text></svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

document.querySelectorAll(".filter").forEach((button) => button.addEventListener("click", () => {
  document.querySelector(".filter.active").classList.remove("active");
  button.classList.add("active"); selectedFilter = button.dataset.filter; loadSpecies().catch(showCatalogError);
}));
search.addEventListener("input", () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => loadSpecies().catch(showCatalogError), 180);
});
document.addEventListener("keydown", (event) => {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
    event.preventDefault();
    search.focus();
  }
});
function showCatalogError(error) {
  empty.hidden = false;
  empty.textContent = `Não foi possível carregar o catálogo: ${error.message}. Verifique se o servidor está rodando com "python3 server.py".`;
  grid.innerHTML = "";
}
loadSpecies().catch(showCatalogError);

const eras = {
  Permiano: ["ERA DOS RÉPTEIS", "A grande transformação", "Depois da maior extinção da história, a vida se recuperou. Os primeiros dinossauros surgiram pequenos, mas o mundo estava prestes a mudar para sempre.", "🌋"],
  Triássico: ["O COMEÇO", "Os primeiros passos", "Em um planeta ainda quente e seco, os primeiros dinossauros começaram sua longa jornada.", "🪨"],
  Jurássico: ["A ERA DOS GIGANTES", "O mundo fica enorme", "Florestas exuberantes cobriram o planeta. Sauropodes gigantescos dominaram as paisagens.", "🌿"],
  Cretáceo: ["A ÚLTIMA ERA", "Um mundo em flor", "As primeiras flores transformaram os ecossistemas antes da grande mudança que encerraria a era dos dinossauros.", "🌺"],
  Cenozoico: ["A ERA DOS MAMÍFEROS", "A vida recomeça", "Após a extinção, os mamíferos ocuparam novos espaços e nossos ancestrais encontraram seu caminho.", "🐘"],
};
let eraIndex = 0;
const eraButtons = [...document.querySelectorAll(".era")];
function selectEra(index) {
  eraIndex = (index + eraButtons.length) % eraButtons.length;
  const button = eraButtons[eraIndex];
  document.querySelector(".era.active").classList.remove("active");
  button.classList.add("active");
  const data = eras[button.dataset.era];
  document.querySelector("#era-kicker").textContent = data[0]; document.querySelector("#era-title").textContent = data[1];
  document.querySelector("#era-description").textContent = data[2]; document.querySelector("#era-emoji").textContent = data[3];
  document.querySelector("#era-number").textContent = String(eraIndex + 1).padStart(2, "0");
}
document.querySelectorAll(".era").forEach((button, index) => button.addEventListener("click", () => {
  selectEra(index);
}));
document.querySelector("#timeline-prev").addEventListener("click", () => selectEra(eraIndex - 1));
document.querySelector("#timeline-next").addEventListener("click", () => selectEra(eraIndex + 1));
const themeToggle = document.querySelector("#theme-toggle");
const savedTheme = localStorage.getItem("dinopedia-theme");
if (savedTheme === "dark") document.body.classList.add("night");
function updateThemeButton() {
  const dark = document.body.classList.contains("night");
  themeToggle.textContent = dark ? "☀" : "◐";
  themeToggle.setAttribute("aria-label", dark ? "Ativar modo claro" : "Ativar modo escuro");
  themeToggle.setAttribute("aria-pressed", String(dark));
}
updateThemeButton();
themeToggle.addEventListener("click", () => {
  document.body.classList.toggle("night");
  localStorage.setItem("dinopedia-theme", document.body.classList.contains("night") ? "dark" : "light");
  updateThemeButton();
});

let rotating = true;
let updateViewerModel = () => {};
const galleryModels = document.querySelectorAll(".gallery-model");
const realModels = {
  "tyrannosaurus rex": ["https://static.poly.pizza/34eed102-48f0-43dd-bc6f-ef7a6dfddfbb.glb", "Modelo real · Poly Pizza · CC0"],
  "velociraptor": ["https://static.poly.pizza/c1f0c4cb-c84f-415c-8323-d8cb871a2126.glb", "Modelo real · Poly Pizza · CC0"],
  "triceratops": ["https://static.poly.pizza/6aa1f3ff-b9b3-4bb5-9d85-b2ffa514f0cc.glb", "Modelo real · Poly Pizza · CC0"],
  "diplodocus": ["https://static.poly.pizza/e60784f1-7b8c-4239-8354-c5d575a864a0.glb", "Modelo real · Poly Pizza · CC BY 3.0"],
  "parasaurolophus": ["https://static.poly.pizza/47b9d0bd-cddb-49be-b072-12201def24a9.glb", "Modelo real · Poly Pizza · CC0"],
  "stegosaurus": ["https://static.poly.pizza/6f8f4ac6-f9e8-488d-97a8-220b9b2fd02a.glb", "Modelo real · Poly Pizza · CC0"],
  "apatosaurus": ["https://static.poly.pizza/7b873860-f23f-4266-b341-5c5e6770cfa0.glb", "Modelo real · Poly Pizza · CC0"],
};
function speciesSeed(name) {
  return [...name].reduce((total, character) => (total * 31 + character.charCodeAt(0)) % 10000, 7);
}
async function initViewer() {
  const { Scene, Color, PerspectiveCamera, WebGLRenderer, HemisphereLight, DirectionalLight, Group, MeshStandardMaterial, Mesh, SphereGeometry, ConeGeometry, CylinderGeometry, BoxGeometry, TorusGeometry, Box3, Vector3 } = await import("https://unpkg.com/three@0.170.0/build/three.module.js");
  const { GLTFLoader } = await import("https://unpkg.com/three@0.170.0/examples/jsm/loaders/GLTFLoader.js");
  const canvas = document.querySelector("#dino-canvas");
  const scene = new Scene(); scene.background = new Color("#dce9df");
  const camera = new PerspectiveCamera(35, 1, 0.1, 100); camera.position.set(0, 2.8, 10); camera.lookAt(0, 1.55, 0);
  const renderer = new WebGLRenderer({ antialias: true }); renderer.setPixelRatio(Math.min(devicePixelRatio, 2)); canvas.replaceChildren(renderer.domElement);
  scene.add(new HemisphereLight("#fff5d5", "#315440", 2.5));
  const key = new DirectionalLight("#ffffff", 3); key.position.set(3, 5, 4); scene.add(key);
  const dinosaur = new Group(); dinosaur.position.set(0, 0, 0); scene.add(dinosaur);
  const sceneColors = { natural: "#dce9df", amber: "#ead4a2", night: "#172438", fossil: "#c7b9a2" };
  document.querySelectorAll(".style-choice").forEach((button) => button.addEventListener("click", () => {
    document.querySelector(".style-choice.active").classList.remove("active"); button.classList.add("active");
    scene.background = new Color(sceneColors[button.dataset.style]);
    canvas.dataset.style = button.dataset.style;
  }));
  let currentGroup = dinosaur;
  function buildModel(item) {
    currentGroup = new Group();
    dinosaur.add(currentGroup);
    const seed = speciesSeed(item.name);
    const size = 0.82 + (seed % 45) / 100;
    const herbivore = item.diet === "Herbívoro";
    const flyer = item.diet === "Voador";
    const ceratopsian = /triceratops|protoceratops|styracosaurus|centrosaurus/i.test(item.name);
    const sauropod = /saurus|brachiosaurus|diplodocus|brontosaurus|apatosaurus/i.test(item.name) && herbivore;
    const color = herbivore ? "#5d9767" : flyer ? "#7661a0" : "#bd5e43";
    const material = new MeshStandardMaterial({ color, roughness: 0.8 });
    const darkMaterial = new MeshStandardMaterial({ color: "#28352d", roughness: 0.9 });
    const add = (geometry, values, scale = [1, 1, 1]) => {
      const mesh = new Mesh(geometry, material);
      mesh.position.set(...values); mesh.scale.set(...scale); currentGroup.add(mesh); return mesh;
    };
    const torso = add(new SphereGeometry(1, 24, 16), [0, 1.65 * size, 0], [1.45 * size, 0.8 * size, 0.7 * size]);
    const hip = add(new SphereGeometry(0.72, 20, 14), [-0.75 * size, 1.58 * size, 0], [0.95 * size, 0.8 * size, 0.72 * size]);
    const neck = add(new CylinderGeometry(0.3, 0.48, (sauropod ? 1.9 : 0.55) * size, 16), [0.85 * size, (sauropod ? 2.55 : 1.95) * size, 0]);
    neck.rotation.z = sauropod ? -0.3 : -0.55;
    const head = add(new SphereGeometry(0.58, 24, 16), [(sauropod ? 1.45 : 1.18) * size, (sauropod ? 3.35 : 2.25) * size, 0], [0.8 * size, 0.62 * size, 0.6 * size]);
    const snout = add(new BoxGeometry(0.72, 0.32, 0.52), [(sauropod ? 1.88 : 1.58) * size, (sauropod ? 3.28 : 2.18) * size, 0], [size, size, size]);
    if (!herbivore) add(new BoxGeometry(0.64, 0.12, 0.5), [1.62 * size, 1.99 * size, 0], [size, size, size]).material = darkMaterial;
    const tail = add(new ConeGeometry(0.2, (sauropod ? 3.6 : 2.8) * size, 16), [(-1.65 - (sauropod ? 0.4 : 0)) * size, 1.75 * size, 0]);
    tail.rotation.z = Math.PI / 2;
    for (const x of [-0.62, 0.55]) {
      for (const z of [-0.38, 0.38]) {
        const leg = add(new CylinderGeometry(0.15, 0.24, (sauropod ? 2.0 : 1.55) * size, 14), [x * size, 0.63 * size, z * size]);
        leg.rotation.z = x < 0 ? 0.1 : -0.1;
        add(new SphereGeometry(0.22 * size, 16, 12), [x * size, 0.03, z * size]);
      }
    }
    add(new SphereGeometry(0.1, 12, 8), [1.5 * size, (sauropod ? 3.55 : 2.42) * size, -0.46 * size], [1, 1, 0.5]).material = darkMaterial;
    if (ceratopsian) {
      for (const z of [-0.28, 0.28]) add(new ConeGeometry(0.08, 0.7 * size, 8), [1.72 * size, 2.62 * size, z * size]).rotation.z = -Math.PI / 2;
      add(new TorusGeometry(0.55 * size, 0.08 * size, 8, 20), [0.85 * size, 2.45 * size, 0]);
    } else if (herbivore && !sauropod) {
      for (const x of [-0.5, -0.2]) add(new ConeGeometry(0.06, 0.42 * size, 8), [x * size, 2.58 * size, 0]);
    } else if (!herbivore && !flyer) {
      for (const z of [-0.28, 0.28]) {
        const arm = add(new CylinderGeometry(0.08, 0.12, 0.7 * size, 12), [0.55 * size, 1.55 * size, z * size]);
        arm.rotation.z = -0.45;
      }
    }
    if (flyer) {
      add(new ConeGeometry(0.08, 2.8 * size, 3), [0, 2.0 * size, 0], [1.2, 1, 1]).rotation.z = Math.PI / 2;
    }
    torso.rotation.z = ((seed % 12) - 6) / 100;
  }
  const loader = new GLTFLoader();
  async function loadRealModel(item) {
    const model = realModels[item.name.toLowerCase()];
    if (!model) {
      dinosaur.remove(...dinosaur.children); buildModel(item);
      document.querySelector("#model-license").textContent = "Modelo procedural · aguardando modelo real licenciado";
      return;
    }
    document.querySelector("#model-license").textContent = "Carregando modelo real licenciado...";
    try {
      const loaded = await loader.loadAsync(model[0]);
      dinosaur.remove(...dinosaur.children);
      const object = loaded.scene;
      object.scale.setScalar(4.2 / Math.max(...new Box3().setFromObject(object).getSize(new Vector3()).toArray()));
      object.position.y = -0.5;
      dinosaur.add(object);
      document.querySelector("#model-license").textContent = model[1];
    } catch (error) {
      dinosaur.remove(...dinosaur.children); buildModel(item);
      document.querySelector("#model-license").textContent = "Modelo real indisponível · usando fallback procedural";
      console.error("Falha ao carregar modelo real", error);
    }
  }
  updateViewerModel = (item) => { loadRealModel(item); };
  buildModel(currentSpecies);
  loadRealModel(currentSpecies);
  function resize() { const width = Math.max(canvas.clientWidth, 280); const height = Math.max(canvas.clientHeight, 280); camera.aspect = width / height; camera.lookAt(0, 1.55, 0); camera.updateProjectionMatrix(); renderer.setSize(width, height, false); }
  new ResizeObserver(resize).observe(canvas); resize();
  function animate() { requestAnimationFrame(animate); if (rotating) dinosaur.rotation.y += 0.006; renderer.render(scene, camera); } animate();
}
initViewer().catch((error) => { document.querySelector("#dino-canvas").textContent = "Visualizador 3D indisponível, mas o catálogo continua funcionando."; console.error(error); });
document.querySelector("#viewer-spin").addEventListener("click", () => { rotating = !rotating; });
function selectSpecies(item) { currentSpecies = item; updateViewerModel(item); document.querySelector("#viewer-name").textContent = item.name; document.querySelector("#viewer-description").textContent = item.description; document.querySelector("#modelos-3d").scrollIntoView({ behavior: "smooth" }); }
galleryModels.forEach((button) => button.addEventListener("click", () => {
  galleryModels.forEach((entry) => entry.classList.remove("active")); button.classList.add("active");
  selectSpecies({ name: button.dataset.model, description: "Modelo 3D real curado para exploração interativa." });
}));

const questions = [["Qual destes animais viveu no Cretáceo?", ["Tyrannosaurus rex", "Diplodocus", "Dimetrodon"], 0], ["O que significa fóssil?", ["Pedra preciosa", "Vestígio de vida antiga", "Osso de dinossauro"], 1], ["Quem come plantas?", ["Herbívoros", "Carnívoros", "Onívoros"], 0], ["Onde há fósseis?", ["Somente museus", "Rochas sedimentares", "Somente no mar"], 1], ["O que é extinção?", ["Surgimento", "Mudança de habitat", "Desaparecimento de espécie"], 2]];
let questionIndex = 0; let score = 0; const dialog = document.querySelector("#quiz-dialog"); const content = document.querySelector("#quiz-content");
function showQuestion() { const [question, answers, correct] = questions[questionIndex]; content.innerHTML = `<p class="quiz-question">${question}</p>${answers.map((answer, index) => `<button class="quiz-answer" data-answer="${index}">${answer}</button>`).join("")}`; content.querySelectorAll(".quiz-answer").forEach((answer) => answer.addEventListener("click", () => { if (+answer.dataset.answer === correct) score++; questionIndex++; questionIndex < questions.length ? showQuestion() : showResult(); })); }
function showResult() { content.innerHTML = `<p class="eyebrow">Resultado</p><h2>${score >= 4 ? "Você tem alma de paleontólogo!" : "Um ótimo começo!"}</h2><p class="quiz-question">Você acertou ${score} de ${questions.length} perguntas.</p><button class="button button-primary" id="quiz-restart">Tentar novamente</button>`; document.querySelector("#quiz-restart").addEventListener("click", startQuiz); }
function startQuiz() { questionIndex = 0; score = 0; showQuestion(); dialog.showModal(); }
document.querySelector("#quiz-start").addEventListener("click", startQuiz); document.querySelector("#quiz-close").addEventListener("click", () => dialog.close());
