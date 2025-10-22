document.addEventListener('DOMContentLoaded', async () => {
  const productsSelect = new TomSelect("#products", {
    plugins: ['remove_button'],
    persist: false,
    create: true,
    placeholder: 'Select or add products...',
    options: []
  });

  const quantityGroup = document.getElementById('quantities');
  const quantityContainer = document.getElementById('quantityContainer');
  let productsData = [];

  async function loadProducts() {
    try {
      const res = await fetch('https://n8n.srv1069938.hstgr.cloud/webhook/products-list');
      const data = await res.json();

      productsData = data;

      const options = data.map(p => ({
        value: p.Products,
        text: p.Products
      }));

      productsSelect.addOptions(options);
    } catch (err) {
      console.error('Error loading products:', err);
      alert('⚠️ Unable to load products from database.');
    }
  }

  await loadProducts();

  productsSelect.on('change', () => {
    const selected = productsSelect.getValue();
    quantityContainer.innerHTML = '';

    if (selected.length === 0) {
      quantityGroup.style.display = 'none';
      return;
    }

    quantityGroup.style.display = 'block';

    selected.forEach(productName => {
      const product = productsData.find(p => p.Products === productName);
      const price = product ? product["Unit Price"] : 0;

      const div = document.createElement('div');
      div.classList.add('row', 'mb-2', 'align-items-center');
      div.innerHTML = `
        <div class="col-md-5">
          <label class="form-label mb-0">${productName}</label>
        </div>
        <div class="col-md-3">
          <input type="number" class="form-control form-control-sm" name="quantity_${productName}" placeholder="Quantity" min="1" required>
        </div>
        <div class="col-md-4">
          <input type="number" class="form-control form-control-sm" name="unitprice_${productName}" step="0.01" value="${price}" placeholder="Unit Price">
        </div>
      `;
      quantityContainer.appendChild(div);
    });
  });

  document.getElementById('customForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = {
      institution: document.getElementById('institution').value.trim(),
      name: document.getElementById('name').value.trim(),
      position: document.getElementById('position').value.trim(),
      address: document.getElementById('address').value.trim(),
      email: document.getElementById('email').value.trim(),
      contactnumber: document.getElementById('contactnumber').value.trim(),
      products: productsSelect.getValue(),
      quantities: [],
      prices: []
    };

    formData.products.forEach(p => {
      formData.quantities.push(document.querySelector(`[name="quantity_${p}"]`).value);
      formData.prices.push(document.querySelector(`[name="unitprice_${p}"]`).value);
    });

    try {
      const res = await fetch('https://n8n.srv1069938.hstgr.cloud/webhook/quotation-request-form', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          products: formData.products.join(','),
          quantities: formData.quantities.join(','),
          prices: formData.prices.join(',')
        })
      });

      if (res.ok) {
        alert('✅ Quotation request submitted successfully!');
        e.target.reset();
        productsSelect.clear();
        quantityGroup.style.display = 'none';
      } else {
        alert('❌ Error submitting form.');
      }
    } catch (err) {
      console.error('Submit error:', err);
      alert('⚠️ Network or server error.');
    }
  });
});

