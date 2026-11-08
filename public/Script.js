const API_URL = 'http://localhost:3000/api/items';

function loadItems() {
    fetch(API_URL)
        .then(res => res.json())
        .then(data => {
            const listElement = document.getElementById('item-list');
            listElement.innerHTML = ''; 
            data.forEach(item => {
                const li = document.createElement('li');
                li.textContent = item.name;
                listElement.appendChild(li);
            });
        })
        .catch(err => console.error('Error fetching data:', err));
}

function addItem() {
    const inputField = document.getElementById('item-input');
    const itemName = inputField.value.trim();

    if (!itemName) {
        alert('Please enter an item name!');
        return;
    }

    fetch(API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name: itemName })
    })
    .then(res => res.json())
    .then(newItem => {
        inputField.value = ''; 
        loadItems(); 
    })
    .catch(err => console.error('Error adding item:', err));
}
loadItems();