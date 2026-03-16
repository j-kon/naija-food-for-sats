const state = {
  alias: "Loading...",
  mode: "unknown",
  items: [],
};

function setStatus(alias, mode) {
  document.getElementById("alias").textContent = alias;
  document.getElementById("mode").textContent = mode.toUpperCase();
}

function renderMenu() {
  const menu = document.getElementById("menu");
  menu.innerHTML = "";

  state.items.forEach((item) => {
    const card = document.createElement("article");
    card.className = "card";

    card.innerHTML = `
      <img src="/assets/${item.source}" alt="${item.name}" />
      <div class="card-body">
        <h2>${item.name}</h2>
        <p class="price">${item.price} sats</p>
        <p class="description">${item.description}</p>
        <div class="actions">
          <button data-action="order" data-source="${item.source}" ${
            item.ordered ? "disabled" : ""
          }>
            ${item.ordering ? "Creating..." : "Order Now"}
          </button>
          <button data-action="verify" data-source="${item.source}" ${
            !item.paymentHash || item.fileUrl ? "disabled" : ""
          }>
            ${item.verifying ? "Checking..." : "Verify Payment"}
          </button>
        </div>
        <textarea readonly>${item.invoice}</textarea>
        <div class="download-row ${item.fileUrl ? "" : "hidden"}">
          <a class="download-link" href="${item.fileUrl}" target="_blank" rel="noreferrer">View</a>
          <a class="download-link" href="${item.fileUrl}" download>Download</a>
        </div>
      </div>
    `;

    menu.appendChild(card);
  });
}

function updateItem(source, next) {
  state.items = state.items.map((item) =>
    item.source === source ? { ...item, ...next } : item
  );
  renderMenu();
}

async function bootstrap() {
  try {
    const [infoResponse, productResponse] = await Promise.all([
      fetch("/getinfo"),
      fetch("/products"),
    ]);

    const info = await infoResponse.json();
    const products = await productResponse.json();

    state.alias = info.alias || "Unknown node";
    state.mode = info.mode || "unknown";
    state.items = products.map((item) => ({
      ...item,
      fileUrl: "",
      invoice: "",
      ordered: false,
      ordering: false,
      paymentHash: "",
      verifying: false,
    }));

    setStatus(state.alias, state.mode);
    renderMenu();
  } catch (_error) {
    setStatus("Backend unavailable", "offline");
  }
}

async function orderItem(source) {
  updateItem(source, { ordering: true });

  try {
    const response = await fetch(`/generate-invoice/${source}`);
    const data = await response.json();

    updateItem(source, {
      invoice: data.payment_request,
      ordered: true,
      ordering: false,
      paymentHash: data.payment_hash,
    });
  } catch (_error) {
    updateItem(source, { ordering: false });
    window.alert("Unable to generate an invoice right now.");
  }
}

async function verifyPayment(source) {
  const item = state.items.find((entry) => entry.source === source);

  if (!item || !item.paymentHash) {
    return;
  }

  updateItem(source, { verifying: true });

  try {
    const response = await fetch(`/check-invoice/${item.paymentHash}`);
    const data = await response.json();

    if (!data.settled) {
      updateItem(source, { verifying: false });
      window.alert("Payment not yet received. Try again in a moment.");
      return;
    }

    const fileResponse = await fetch(
      `/file/${source}?paymentHash=${encodeURIComponent(item.paymentHash)}`
    );

    if (!fileResponse.ok) {
      throw new Error("download failed");
    }

    const blob = await fileResponse.blob();

    updateItem(source, {
      fileUrl: URL.createObjectURL(blob),
      invoice: "THANKS FOR YOUR ORDER",
      verifying: false,
    });
  } catch (_error) {
    updateItem(source, { verifying: false });
    window.alert("Unable to verify payment right now.");
  }
}

document.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-action]");

  if (!button) {
    return;
  }

  const { action, source } = button.dataset;

  if (action === "order") {
    orderItem(source);
  }

  if (action === "verify") {
    verifyPayment(source);
  }
});

bootstrap();
