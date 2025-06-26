import Client from './client.js'

// сервер
const API_URL = 'https://crm-onz3.onrender.com/api/clients'

tippy('[data-tippy-content]');

// массив клиентов
let clients = []

const $clientsList = document.getElementById('clients-list'),
    $clientsListTHAll = document.querySelectorAll('.main__table th')

let column = 'fio',
    columnDir = true

function debounce(func, delay) {
    let timeoutId;
    return function(...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
}

const $searchInput = document.getElementById('search-input');

// Функция поиска
function search() {
    const searchValue = $searchInput.value.trim().toLowerCase();
    const filteredClients = clients.filter(client => {
        return (
            client.id.toLowerCase().includes(searchValue) ||
            client.surname.toLowerCase().includes(searchValue) ||
            client.name.toLowerCase().includes(searchValue) ||
            client.lastName.toLowerCase().includes(searchValue) ||
            client.createdAt.toString().toLowerCase().includes(searchValue) ||
            client.updatedAt.toString().toLowerCase().includes(searchValue) ||
            client.contacts.some(contact => contact.type.toLowerCase().includes(searchValue) || contact.value.toLowerCase().includes(searchValue))
        );
    });

    $clientsList.innerHTML = '';
    filteredClients.forEach(client => {
        $clientsList.append(newClientTR(client));
    });
}

// Привязываем дебаунсированную функцию к событию ввода
$searchInput.addEventListener('input', debounce(search, 300));

// Функция получения студентов с сервера
async function fetchClients() {
    const spinner = document.createElement('div')
    spinner.classList.add('spinner', 'spinner--hidden')
    const spinnerCircle = document.createElement('div')
    spinnerCircle.classList.add('spinner__circle')
    spinner.append(spinnerCircle)
    $clientsList.append(spinner)

    spinner.classList.remove('spinner--hidden'); // Показываем спиннер

    try {
        const response = await fetch(API_URL)
        if (!response.ok) throw new Error('Ошибка загрузки клиентов')

        const ClientsData = await response.json()
        console.log(ClientsData)

        // Преобразуем каждый объект в экземпляр класса Client
        clients = ClientsData.map(data => new Client(
            data.id,
            data.surname,
            data.name,
            data.lastName,
            new Date(data.createdAt),
            new Date(data.updatedAt),
            data.contacts
        ))

        render()
    } catch (error) {
        console.log(error)
        alert('Не удалось загрузить список клиентов!')
    } finally {
        spinner.classList.add('spinner--hidden'); // Скрываем спиннер
    }
}

// Функция добавления клиента на сервер
async function addClient(client) {
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(client),
        })
        if (!response.ok) throw new Error('Ошибка добавления клиента')
        const createdClient = await response.json(); // Сервер возвращает созданного клиента с `id`
        clients.push(new Client(
            createdClient.id,
            createdClient.surname,
            createdClient.name,
            createdClient.lastName,
            new Date(createdClient.createdAt),
            new Date(createdClient.updatedAt),
            createdClient.contacts
        ));

        render()
    } catch (error) {
        console.log(error);
        alert('Не удалось добавить клиента')
    }
}

// Функция изменения данных клиента
async function changeClient(clientId, changedData) {
    try {
        const response = await fetch(`${API_URL}/${clientId}`, {
            method: 'PATCH',
            body: JSON.stringify(changedData),
            headers: { 'Content-Type': 'application/json' }
        })
        if (!response.ok) throw new Error('Ошибка обновления клиента')

        const changedClient = await response.json()

        // Обновляем клиента в локальном массиве
        const index = clients.findIndex(client => client.id === clientId)
        if (index!== -1) {
            clients[index] = new Client(
                changedClient.id,
                changedClient.surname,
                changedClient.name,
                changedClient.lastName,
                new Date(changedClient.createdAt),
                new Date(changedClient.updatedAt),
                changedClient.contacts
            )
        }

        render()
    } catch (error) {
        console.log(error);
        alert('Не удалось обновить клиента')
    }
}

// Функция удаления клиента с сервера
async function deleteClient(clientId) {
    try {
        const response = await fetch(`${API_URL}/${clientId}`, {
            method: 'DELETE',
        })
        if (!response.ok) throw new Error('Ошибка удаления клиента')
        await fetchClients()
    } catch (error) {
        console.log(error);
        alert('Не удалось удалить клиента')
    }

}

// Функция создания svg
function insertSVGDirectly(svgMarkup, parent, classList) {
    if (typeof parent === 'string') {
        parent = document.querySelector(parent);
    }
    if (parent) {
        const svgElement = new DOMParser()
            .parseFromString(svgMarkup, "image/svg+xml")
            .documentElement; // Преобразуем строку в SVG-элемент
        parent.appendChild(svgElement); // Вставляем SVG в родительский элемент
        svgElement.classList.add(classList)
    } else {
        console.error(`Элемент с селектором или объект "${parent}" не найден.`);
    }
};

// Универсальная функция для создания элемента контакта
function createContactElement(contact) {
    const contactWrapper = document.createElement('div');
    contactWrapper.classList.add('contacts__wrapper');

    const contactType = document.createElement('select');
    contactType.classList.add('js-choice')

    contactType.innerHTML = `
        <option value="phone">Телефон</option>
        <option value="phone">Доп. телефон</option>
        <option value="email">Email</option>
        <option value="vk">VK</option>
        <option value="facebook">Facebook</option>
    `;

    const contactValue = document.createElement('input');
    contactValue.placeholder = 'Введите данные контакта';
    contactValue.classList.add('contacts__input')
    contactValue.required = true

    // Установите значения по умолчанию
    contactType.value = 'phone';
    contactValue.type = 'tel';

    contactType.addEventListener('change', function () {
        const contactTypeValue = contactType.value
        switch (contactTypeValue) {
            case 'phone':
                contactValue.type = 'tel'
                if (contactValue.type!== 'tel') {
                    alert('Неверный формат данных')
                }
                break
            case 'email':
                contactValue.type = 'email'
                break
            case 'vk':
            case 'facebook':
                contactValue.type = 'url'
                break
            default:
                contactValue.type = 'text'
                break
        }

    })

    const deleteContactBtn = document.createElement('button');
    deleteContactBtn.classList.add('contacts__delete-contact-btn', 'btn-reset')
    deleteContactBtn.addEventListener('click', () => contactWrapper.remove());

    const deleteSvg = `
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g clip-path="url(#clip0_224_6681)">
    <path d="M8 2C4.682 2 2 4.682 2 8C2 11.318 4.682 14 8 14C11.318 14 14 11.318 14 8C14 4.682 11.318 2 8 2ZM8 12.8C5.354 12.8 3.2 10.646 3.2 8C3.2 5.354 5.354 3.2 8 3.2C10.646 3.2 12.8 5.354 12.8 8C12.8 10.646 10.646 12.8 8 12.8ZM10.154 5L8 7.154L5.846 5L5 5.846L7.154 8L5 10.154L5.846 11L8 8.846L10.154 11L11 10.154L8.846 8L11 5.846L10.154 5Z" fill="none"/>
    </g>
    <defs>
    <clipPath id="clip0_224_6681">
    <rect width="16" height="16" fill="white"/>
    </clipPath>
    </defs>
    </svg>
    `
    insertSVGDirectly(deleteSvg, deleteContactBtn, 'contacts__delete-contact-box')

    contactWrapper.append(contactType, contactValue, deleteContactBtn);

    return contactWrapper;
}

// Функция добавления контакта
function addContact(container) {
    const newContact = {
        type: '',
        value: ''
    };
    const contactWrapper = createContactElement(newContact);
    container.append(contactWrapper);

    // Инициализируем Choices.js для нового элемента
    const newChoiceElement = contactWrapper.querySelector('.js-choice');
    const newChoices = new Choices(newChoiceElement, {
        searchEnabled: false,
        itemSelectText: ''
    });
}

// Валидация  
function validation(contacts, surname, name, lastname) {
    const errors = [];
    const lettersOnly = /^\p{L}+$/u;

    // Проверка обязательных полей и форматирование
    if (surname === '' || name === '') {
        errors.push('Поля "Имя" и "Фамилия" обязательны для заполнения');
    } else {
        if (!lettersOnly.test(surname)) {
            errors.push('Фамилия должна содержать только буквы');
        } 
        if (!lettersOnly.test(name)) {
            errors.push('Имя должно содержать только буквы');
        }  
    }

    if (lastname.length > 0) {
        if (!lettersOnly.test(lastname)) {
            errors.push('Отчество должно содержать только буквы');
        } 
    }

    // Проверка контактов
    for (const contact of contacts) {
        if (contact.type === 'phone' && !/^\d+$/.test(contact.value)) {
            errors.push('Неверный формат телефонного номера');
        }

        if (contact.type === 'email' && !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(contact.value)) {
            errors.push('Неверный формат электронной почты');
        }
    }

    // Проверка максимального количества контактов
    if (contacts.length > 10) {
        errors.push('Превышено максимальное количество контактов');
    }

    // Возвращаем обновленные значения
    return errors
}

function validatinRegistry(value) {
    return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase()
}

// Функция для получения иконки по типу контакта
function getContactIconSVG(type) {
    const icons = {
      'phone': `
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <g opacity="0">
        <circle cx="8" cy="8" r="8" fill="#9873FF"/>
        <path d="M11.56 9.50222C11.0133 9.50222 10.4844 9.41333 9.99111 9.25333C9.83556 9.2 9.66222 9.24 9.54222 9.36L8.84444 10.2356C7.58667 9.63556 6.40889 8.50222 5.78222 7.2L6.64889 6.46222C6.76889 6.33778 6.80444 6.16444 6.75556 6.00889C6.59111 5.51556 6.50667 4.98667 6.50667 4.44C6.50667 4.2 6.30667 4 6.06667 4H4.52889C4.28889 4 4 4.10667 4 4.44C4 8.56889 7.43556 12 11.56 12C11.8756 12 12 11.72 12 11.4756V9.94222C12 9.70222 11.8 9.50222 11.56 9.50222Z" fill="white"/>
        </g>
        </svg>
      `,
      'email': `
      <svg class="others-svg" width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path opacity="0" fill-rule="evenodd" clip-rule="evenodd" d="M8 16C12.4183 16 16 12.4183 16 8C16 3.58172 12.4183 0 8 0C3.58172 0 0 3.58172 0 8C0 12.4183 3.58172 16 8 16ZM4 5.75C4 5.3375 4.36 5 4.8 5H11.2C11.64 5 12 5.3375 12 5.75V10.25C12 10.6625 11.64 11 11.2 11H4.8C4.36 11 4 10.6625 4 10.25V5.75ZM8.424 8.1275L11.04 6.59375C11.14 6.53375 11.2 6.4325 11.2 6.32375C11.2 6.0725 10.908 5.9225 10.68 6.05375L8 7.625L5.32 6.05375C5.092 5.9225 4.8 6.0725 4.8 6.32375C4.8 6.4325 4.86 6.53375 4.96 6.59375L7.576 8.1275C7.836 8.28125 8.164 8.28125 8.424 8.1275Z" fill="#9873FF"/>
        </svg>
        `,
      'vk': `
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <g opacity="0">
        <path d="M8 0C3.58187 0 0 3.58171 0 8C0 12.4183 3.58187 16 8 16C12.4181 16 16 12.4183 16 8C16 3.58171 12.4181 0 8 0ZM12.058 8.86523C12.4309 9.22942 12.8254 9.57217 13.1601 9.97402C13.3084 10.1518 13.4482 10.3356 13.5546 10.5423C13.7065 10.8371 13.5693 11.1604 13.3055 11.1779L11.6665 11.1776C11.2432 11.2126 10.9064 11.0419 10.6224 10.7525C10.3957 10.5219 10.1853 10.2755 9.96698 10.037C9.87777 9.93915 9.78382 9.847 9.67186 9.77449C9.44843 9.62914 9.2543 9.67366 9.1263 9.90707C8.99585 10.1446 8.96606 10.4078 8.95362 10.6721C8.93577 11.0586 8.81923 11.1596 8.43147 11.1777C7.60291 11.2165 6.81674 11.0908 6.08606 10.6731C5.44147 10.3047 4.94257 9.78463 4.50783 9.19587C3.66126 8.04812 3.01291 6.78842 2.43036 5.49254C2.29925 5.2007 2.39517 5.04454 2.71714 5.03849C3.25205 5.02817 3.78697 5.02948 4.32188 5.03799C4.53958 5.04143 4.68362 5.166 4.76726 5.37142C5.05633 6.08262 5.4107 6.75928 5.85477 7.38684C5.97311 7.55396 6.09391 7.72059 6.26594 7.83861C6.45582 7.9689 6.60051 7.92585 6.69005 7.71388C6.74734 7.57917 6.77205 7.43513 6.78449 7.29076C6.82705 6.79628 6.83212 6.30195 6.75847 5.80943C6.71263 5.50122 6.53929 5.30218 6.23206 5.24391C6.07558 5.21428 6.0985 5.15634 6.17461 5.06697C6.3067 4.91245 6.43045 4.81686 6.67777 4.81686L8.52951 4.81653C8.82136 4.87382 8.88683 5.00477 8.92645 5.29874L8.92808 7.35656C8.92464 7.47032 8.98521 7.80751 9.18948 7.88198C9.35317 7.936 9.4612 7.80473 9.55908 7.70112C10.0032 7.22987 10.3195 6.67368 10.6029 6.09801C10.7279 5.84413 10.8358 5.58142 10.9406 5.31822C11.0185 5.1236 11.1396 5.02785 11.3593 5.03112L13.1424 5.03325C13.195 5.03325 13.2483 5.03374 13.3004 5.04274C13.6009 5.09414 13.6832 5.22345 13.5903 5.5166C13.4439 5.97721 13.1596 6.36088 12.8817 6.74553C12.5838 7.15736 12.2661 7.55478 11.9711 7.96841C11.7001 8.34652 11.7215 8.53688 12.058 8.86523Z" fill="#9873FF"/>
        </g>
        </svg>
        `,
      'facebook': `
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <g opacity="0">
        <path d="M7.99999 0C3.6 0 0 3.60643 0 8.04819C0 12.0643 2.928 15.3976 6.75199 16V10.3775H4.71999V8.04819H6.75199V6.27309C6.75199 4.25703 7.94399 3.14859 9.77599 3.14859C10.648 3.14859 11.56 3.30121 11.56 3.30121V5.28514H10.552C9.55999 5.28514 9.24799 5.90362 9.24799 6.53815V8.04819H11.472L11.112 10.3775H9.24799V16C11.1331 15.7011 12.8497 14.7354 14.0879 13.2772C15.3261 11.819 16.0043 9.96437 16 8.04819C16 3.60643 12.4 0 7.99999 0Z" fill="#9873FF"/>
        </g>
        </svg>
        `,
      'default': `
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path opacity="0" fill-rule="evenodd" clip-rule="evenodd" d="M8 16C12.4183 16 16 12.4183 16 8C16 3.58172 12.4183 0 8 0C3.58172 0 0 3.58172 0 8C0 12.4183 3.58172 16 8 16ZM3 8C3 5.24 5.24 3 8 3C10.76 3 13 5.24 13 8C13 10.76 10.76 13 8 13C5.24 13 3 10.76 3 8ZM9.5 6C9.5 5.17 8.83 4.5 8 4.5C7.17 4.5 6.5 5.17 6.5 6C6.5 6.83 7.17 7.5 8 7.5C8.83 7.5 9.5 6.83 9.5 6ZM5 9.99C5.645 10.96 6.75 11.6 8 11.6C9.25 11.6 10.355 10.96 11 9.99C10.985 8.995 8.995 8.45 8 8.45C7 8.45 5.015 8.995 5 9.99Z" fill="#9873FF"/>
        </svg>
        `
    };
  
    return icons[type] || icons['default'];
}

// создаем контакт
function createContact(contactObj) {
    const contactBtn = document.createElement('a');
    contactBtn.innerHTML = getContactIconSVG(contactObj.type);
    contactBtn.setAttribute('aria-expanded', false);

    const triggerWrapper = document.createElement('span');
    triggerWrapper.classList.add('contact-box__span')

    //tippy initialization
    const tippyinst = tippy(contactBtn, {
        content: `<span>${contactObj.type}: <a style="color: violet" href="!#"><b >${contactObj.value}</b></a></span>`,
        allowHTML: true,
        interactive: true,
        appendTo: triggerWrapper,
    })
    //   закрываем на блюр. вешаем событие на последний интерактивный элемент в тултипе
    tippyinst.popper.querySelector('a').addEventListener('blur', () => tippyinst.hide())

    triggerWrapper.append(contactBtn)
    return triggerWrapper;
}

// создаем кнопку +num
function createMoreBtn(num) {
    const moreBtn = document.createElement('button');
    moreBtn.classList.add('more-contacts-btn')
    moreBtn.textContent = `+${num}`;
    return moreBtn;
}

// Получить TR клиента
function newClientTR(client) {
    const $clientTR = document.createElement('tr'),
        $idTD = document.createElement('td'),
        $fioTD = document.createElement('td'),
        $createdTD = document.createElement('td'),
        $changedTD = document.createElement('td'),
        $contactsTD = document.createElement('td'),
        $actionsTD = document.createElement('td'),
        $changeActionsBtn = document.createElement('button'),
        $deleteActionsBtn = document.createElement('button')

    $idTD.textContent = client.id
    $fioTD.textContent = client.fio
    $createdTD.innerHTML = `${client.createdAt.toLocaleDateString()} <span class="time">${client.createdAt.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', hour12: false })}</span>`
    $changedTD.innerHTML = `${client.updatedAt.toLocaleDateString()} <span class="time">${client.updatedAt.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', hour12: false })}</span>`
    
    const contactCount = client.contacts.length;
    const displayedContacts = client.contacts.slice(0, 4);  // Показываем первые 4 контакта

    const contactsElems = displayedContacts.map(contact => createContact(contact));
    const contactsSvgBox = document.createElement('div')
    contactsSvgBox.classList.add('contact-box')
    contactsSvgBox.append(...contactsElems);
    $contactsTD.append(contactsSvgBox);

    if (contactCount > 4) {
        const moreBtn = createMoreBtn(contactCount - 4);
        contactsSvgBox.append(moreBtn);

        moreBtn.addEventListener('click', () => {
            const hiddenContacts = client.contacts.slice(4).map(contact => createContact(contact));
            contactsSvgBox.append(...hiddenContacts);
            moreBtn.remove();
        });
    }

    const $editBtns = document.createElement('div')
    $editBtns.classList.add('actions')

    $changeActionsBtn.textContent = 'Изменить'
    $changeActionsBtn.id = 'changeModal'
    $changeActionsBtn.classList.add('actions__change-btn', 'btn-reset')
    
    const changeSvg = `
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g opacity="0.7" clip-path="url(#clip0_224_718)">
    <path d="M2 11.5002V14.0002H4.5L11.8733 6.62687L9.37333 4.12687L2 11.5002ZM13.8067 4.69354C14.0667 4.43354 14.0667 4.01354 13.8067 3.75354L12.2467 2.19354C11.9867 1.93354 11.5667 1.93354 11.3067 2.19354L10.0867 3.41354L12.5867 5.91354L13.8067 4.69354Z" fill="#9873FF"/>
    </g>
    <defs>
    <clipPath id="clip0_224_718">
    <rect width="16" height="16" fill="white"/>
    </clipPath>
    </defs>
    </svg>
    `
    insertSVGDirectly(changeSvg, $changeActionsBtn, 'actions__change-svg')

    $deleteActionsBtn.textContent = 'Удалить'
    $deleteActionsBtn.id = 'deleteModal'
    $deleteActionsBtn.classList.add('actions__delete-btn', 'btn-reset')

    const canselSvg = `
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g opacity="0.7" clip-path="url(#clip0_224_723)">
    <path d="M8 2C4.682 2 2 4.682 2 8C2 11.318 4.682 14 8 14C11.318 14 14 11.318 14 8C14 4.682 11.318 2 8 2ZM8 12.8C5.354 12.8 3.2 10.646 3.2 8C3.2 5.354 5.354 3.2 8 3.2C10.646 3.2 12.8 5.354 12.8 8C12.8 10.646 10.646 12.8 8 12.8ZM10.154 5L8 7.154L5.846 5L5 5.846L7.154 8L5 10.154L5.846 11L8 8.846L10.154 11L11 10.154L8.846 8L11 5.846L10.154 5Z" fill="#F06A4D"/>
    </g>
    <defs>
    <clipPath id="clip0_224_723">
    <rect width="16" height="16" fill="white"/>
    </clipPath>
    </defs>
    </svg>
    `

    insertSVGDirectly(canselSvg,  $deleteActionsBtn, 'actions__delete-svg')

    $editBtns.append($changeActionsBtn, $deleteActionsBtn)
    // Функция вызова блока с удалением
    function deleteWrap() {
        modal(
            function (wrap, box, title, closeBtn) {
                box.classList.add('delete-box')
                title.textContent = 'Удалить клиента'

                const modalDescr = document.createElement('p')
                modalDescr.textContent = 'Вы действительно хотите удалить данного клиента?'
                modalDescr.classList.add('modal__descr')

                const modalRemoveBtn = document.createElement('button')
                modalRemoveBtn.classList.add('modal__btn', 'btn-reset')
                modalRemoveBtn.textContent = 'Удалить'
                modalRemoveBtn.addEventListener('click', function () {
                    deleteClient(client.id)
                    wrap.remove()
                })

                const cancelBtn = document.createElement('button')
                cancelBtn.classList.add('modal__cancel-btn', 'btn-reset')
                cancelBtn.textContent = 'Отмена'
                cancelBtn.addEventListener('click', () => wrap.remove())

                box.append(modalDescr, modalRemoveBtn, cancelBtn)
            },
            function () { }
        )
    }

    $changeActionsBtn.addEventListener('click', function () {
        modal(
            function (wrap, box, title, modalTop, closeBtn) {
                title.textContent = 'Изменить данные'

                const modalSpan = document.createElement('span')
                const modalForm = document.createElement('form')
                const inputSurname = document.createElement('input')
                const inputName = document.createElement('input')
                const inputLastname = document.createElement('input')
                const contactsContainer = document.createElement('div')
                const addContactBtn = document.createElement('button')
                const saveBtn = document.createElement('button')
                const cancelBtn = document.createElement('button')
                const modalErrorsContainer = document.createElement('div')

                modalSpan.textContent = `ID: ${client.id}`
                modalSpan.classList.add('modalSpan-id')
                modalTop.append(modalSpan)

                const contactBox = document.createElement('div');
                contactBox.classList.add('contacts__box');
                contactsContainer.append(contactBox);

                modalErrorsContainer.classList.add('modal__errors-container')
                modalErrorsContainer.id ='modalErrorsContainer' 

                modalForm.classList.add('form')
                modalForm.id = 'edit-client'

                inputSurname.type = 'text'
                inputSurname.placeholder = 'Фамилия*'
                inputSurname.required = true
                inputSurname.value = client.surname
                inputSurname.classList.add('form__input')

                inputName.type = 'text'
                inputName.placeholder = 'Имя*'
                inputName.required = true
                inputName.value = client.name
                inputName.classList.add('form__input')

                inputLastname.type = 'text'
                inputLastname.placeholder = 'Отчество'
                inputLastname.value = client.lastName
                inputLastname.classList.add('form__input')

                const createLabelWithStar = (labelText) => {
                    const label = document.createElement('label');
                    if (labelText !== 'Отчество') {
                        label.innerHTML = `<span class="form__label">${labelText} <span class="star">*</span></span>`;
                    } else {
                        label.innerHTML = `${labelText}`;
                    }
                    return label;
                };
                
                const labelSurname = createLabelWithStar('Фамилия');
                const labelName = createLabelWithStar('Имя');
                const labelLastname = createLabelWithStar('Отчество');
    
                const surnameDiv = document.createElement('div')
                surnameDiv.classList.add('form__div')
                surnameDiv.append(inputSurname, labelSurname)
    
                const nameDiv = document.createElement('div')
                nameDiv.classList.add('form__div')
                nameDiv.append(inputName, labelName)
    
                const lastnameDiv = document.createElement('div')
                lastnameDiv.classList.add('form__div')
                lastnameDiv.append(inputLastname, labelLastname)

                contactsContainer.classList.add('contacts')

                addContactBtn.textContent = 'Добавить контакт'
                addContactBtn.type = 'button'
                addContactBtn.classList.add('contacts__add-contact-btn', 'btn-reset')

                const addContactSvg = `
                <svg viewBox="0 0 160 160" height="16" width="16" xmlns="http://www.w3.org/2000/svg" >
                    <circle r="60" cx="80" cy="80" fill="none" stroke="#9873FF" stroke-width="13.5px"></circle>
                    <g fill="none" >
                    <rect width="13.5" height="66.5" x="73.3" y="46.6" rx="7"></rect>
                    <rect width="13.5" height="66.5" x="73.3" y="46.6" rx="7" transform = "rotate(90 80 80)"></rect>
                    </g>
                </svg>
                `
                insertSVGDirectly(addContactSvg, addContactBtn, 'contacts__add-contact-box')


                addContactBtn.addEventListener('click', () => {
                     contactsContainer.classList.add('on-click')
                    addContact(contactBox)
                })

                // Добавляем существующие контакты
                client.contacts.forEach(contact => {
                    const contactWrapper = createContactElement(contact)
                    contactWrapper.querySelector('select').value = contact.type
                    contactWrapper.querySelector('input').value = contact.value
                    contactBox.append(contactWrapper)
                    const choices = new Choices(contactWrapper.querySelector('select'), {
                        searchEnabled: false,
                        itemSelectText: ''
                    });
                    if (contactWrapper) {
                        contactsContainer.classList.add('on-click')
                    }
                })
                contactsContainer.append(addContactBtn)

                saveBtn.classList.add('modal__btn', 'btn-reset')
                saveBtn.textContent = 'Сохранить'

                cancelBtn.classList.add('modal__cancel-btn', 'btn-reset')
                cancelBtn.textContent = 'Удалить клиента'
                cancelBtn.type = 'button'
                cancelBtn.addEventListener('click', () => {
                    deleteWrap()
                    wrap.remove()
                })

                modalForm.append(surnameDiv, nameDiv, lastnameDiv, contactsContainer, modalErrorsContainer, saveBtn, cancelBtn)
                box.append(modalForm)

                // Добавление клиента
                saveBtn.addEventListener('click', async function (e) {
                    e.preventDefault()

                    const surname = inputSurname.value.trim()
                    const name = inputName.value.trim()
                    const lastname = inputLastname.value.trim()

                    const changedData = {
                        surname: validatinRegistry(surname),
                        name: validatinRegistry(name),
                        lastName: validatinRegistry(lastname),
                    }

                    const contacts = Array.from(contactBox.children).map(contact => ({
                        type: contact.querySelector('select').value,
                        value: contact.querySelector('input').value.trim()
                    }))

                    const errorMessages = validation(contacts, changedData.surname, changedData.name, changedData.lastName)

                    const errorContainer = document.getElementById('modalErrorsContainer')
                    errorContainer.innerHTML = '' // Очищаем предыдущие ошибки

                    if (errorMessages.length > 0) {
                        // Вывод ошибок
                        errorMessages.forEach(error => {
                            const errorItem = document.createElement('p');
                            errorItem.textContent = error;
                            errorContainer.append(errorItem);
                        });
                        return;
                    }

                    await changeClient(client.id, {...changedData, contacts })
                    wrap.remove()
                    $searchInput.value = ''
                })
            },
            function () { }
        )
    })

    $deleteActionsBtn.addEventListener('click', () => {
        deleteWrap()
    })

    $actionsTD.append($editBtns)
    $clientTR.append($idTD, $fioTD, $createdTD, $changedTD, $contactsTD, $actionsTD)

    return $clientTR
}

// Функция сортировки массива
function getSortClients(prop, dir) {
    const clientsCopy = [...clients]
    return clientsCopy.sort(function (clientA, clientB) {
        if ((dir? clientA[prop] < clientB[prop] : clientA[prop] > clientB[prop]))
            return -1
    })
}

// Отрисовка
function render() {
    let clientsCopy = [...clients]

    clientsCopy = getSortClients(column, columnDir)

    $clientsList.innerHTML = ''

    for (const client of clientsCopy) {
        const clientTR = newClientTR(client);
        $clientsList.append(clientTR);

        // Инициализируем Choices.js для всех контактов этого клиента
        const contactElements = clientTR.querySelectorAll('.js-choice');
        contactElements.forEach(element => {
            const choices = new Choices(element, {
                searchEnabled: false,
                itemSelectText: ''
            });
        });
    }
}

// Событие сортировки
$clientsListTHAll.forEach((element, index) => {
    if (element.dataset.column === 'fio') {
        const letters = document.createElement('span')
        letters.classList.add('fio-span')
        letters.textContent = 'А-Я'
        element.appendChild(letters)
    }

    element.addEventListener('click', function () {
        column = this.dataset.column
        columnDir =!columnDir
        const arrow = this.querySelector('.main__svg')
        const letters = this.querySelector('span')
        if (this.dataset.column === 'fio') {
            if (columnDir) {
                letters.textContent = 'А-Я'
            } else {
                letters.textContent = 'Я-А'
            }
        }
        if (arrow.classList.contains('main__svg--rotate') === false) {
            arrow.classList.add('main__svg--rotate')
        } else {
            arrow.classList.remove('main__svg--rotate')
        }
        render()
    })
})

// Функция модального окна
function modal(open, close){
    let modalWrap = document.createElement('div')
    let modalBox = document.createElement('div')
    let modalTitle = document.createElement('h2')
    let modalCloseBtn = document.createElement('button')
    let modalCloseImg = document.createElement('img')
    let modalTop = document.createElement('div')

    modalWrap.classList.add('modal')
    modalBox.classList.add('modal__box')
    modalTop.classList.add('modal__top')
    modalTitle.classList.add('modal__title')
    modalCloseBtn.classList.add('modal__close-btn', 'btn-reset')
    modalCloseImg.classList.add('modal__close-img')
    modalCloseImg.src = 'img/close.svg'

    modalCloseBtn.append(modalCloseImg)
    modalTop.append(modalTitle, modalCloseBtn)
    modalBox.append(modalTop)
    modalWrap.append(modalBox)

    open(modalWrap, modalBox, modalTitle, modalTop, modalCloseBtn)

    modalCloseBtn.addEventListener('click', function () {
        modalWrap.remove()

        close()
    });

    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape') {
            modalWrap.remove();
            close();
        }
    });

    document.body.append(modalWrap)
}

// Добавление клиента
document.getElementById('addModal').addEventListener('click', function () {
    modal(
        // Открытие
        function (wrap, box, title, closeBtn) {
            title.textContent = 'Новый клиент'

            const modalForm = document.createElement('form')
            const inputSurname = document.createElement('input')
            const inputName = document.createElement('input')
            const inputLastname = document.createElement('input')
            const addBtn = document.createElement('button')
            const contactsContainer = document.createElement('div')
            const addContactBtn = document.createElement('button')
            const modalErrorsContainer = document.createElement('div')

            const cancelBtn = document.createElement('button')
            cancelBtn.classList.add('modal__cancel-btn', 'btn-reset')
            cancelBtn.textContent = 'Отмена'
            cancelBtn.addEventListener('click', () => wrap.remove())

            const contactBox = document.createElement('div');
            contactBox.classList.add('contacts__box');
            contactsContainer.append(contactBox);

            modalErrorsContainer.classList.add('modal__errors-container')
            modalErrorsContainer.id ='modalErrorsContainer'

            modalForm.classList.add('form')
            modalForm.id = 'add-client'

            inputSurname.type = 'text'
            inputSurname.placeholder = `Фамилия*`
            inputSurname.required = true
            inputSurname.id = 'input-surname'
            inputSurname.classList.add('form__input')

            inputName.type = 'text'
            inputName.placeholder = 'Имя*'
            inputName.required = true
            inputName.id = 'input-name'
            inputName.classList.add('form__input')

            inputLastname.type = 'text'
            inputLastname.placeholder = 'Отчество'
            inputLastname.required = false
            inputLastname.classList.add('form__input')
            inputLastname.id = 'input-lastname'

            contactsContainer.classList.add('contacts')
            addContactBtn.textContent = 'Добавить контакт'
            addContactBtn.classList.add('contacts__add-contact-btn', 'btn-reset')
            addContactBtn.type = 'button'

            const addContactSvg = `
            <svg viewBox="0 0 160 160" height="16" width="16" xmlns="http://www.w3.org/2000/svg" >
                <circle r="60" cx="80" cy="80" fill="none" stroke="#9873FF" stroke-width="13.5px"></circle>
                <g fill="none" >
                <rect width="13.5" height="66.5" x="73.3" y="46.6" rx="7"></rect>
                <rect width="13.5" height="66.5" x="73.3" y="46.6" rx="7" transform = "rotate(90 80 80)"></rect>
                </g>
            </svg>
            `
            insertSVGDirectly(addContactSvg, addContactBtn, 'contacts__add-contact-box')


            addContactBtn.addEventListener('click', () => {
                 contactsContainer.classList.add('on-click')
                addContact(contactBox) 
            })
            contactsContainer.append(addContactBtn)

            addBtn.classList.add('modal__btn', 'btn-reset')
            addBtn.textContent = 'Сохранить'

            const createLabelWithStar = (labelText) => {
                const label = document.createElement('label');
                if (labelText !== 'Отчество') {
                    label.innerHTML = `<span class="form__label">${labelText} <span class="star">*</span></span>`;
                } else {
                    label.innerHTML = `<span class="form__label">${labelText}</span>`;
                }
                return label;
            };
            
            const labelSurname = createLabelWithStar('Фамилия');
            const labelName = createLabelWithStar('Имя');
            const labelLastname = createLabelWithStar('Отчество');

            const surnameDiv = document.createElement('div')
            surnameDiv.classList.add('form__div')
            surnameDiv.append(inputSurname, labelSurname)

            const nameDiv = document.createElement('div')
            nameDiv.classList.add('form__div')
            nameDiv.append(inputName, labelName)

            const lastnameDiv = document.createElement('div')
            lastnameDiv.classList.add('form__div')
            lastnameDiv.append(inputLastname, labelLastname)
            

            modalForm.append(surnameDiv, nameDiv, lastnameDiv, contactsContainer, modalErrorsContainer, addBtn, cancelBtn)
            box.append(modalForm)

            // Добавление клиента
            addBtn.addEventListener('click', async function (e) {
                e.preventDefault()

                const surname = inputSurname.value.trim()
                const name = inputName.value.trim()
                const lastname = inputLastname.value.trim()


                const contacts = Array.from(contactBox.children).map(contact => ({
                    type: contact.querySelector('select').value,
                    value: contact.querySelector('input').value.trim()
                }))

                const errorMessages = validation(contacts, surname, name, lastname)

                const errorContainer = document.getElementById('modalErrorsContainer')
                errorContainer.innerHTML = '' // Очищаем предыдущие ошибки

                if (errorMessages.length > 0) {
                    // Вывод ошибок
                    errorMessages.forEach(error => {
                        const errorItem = document.createElement('p');
                        errorItem.textContent = error;
                        errorContainer.append(errorItem);
                    });

                    return;
                }

                const newClient = {
                    surname: validatinRegistry(surname),
                    name: validatinRegistry(name),
                    lastName: validatinRegistry(lastname),
                    contacts
                }

                await addClient(newClient)
                wrap.remove()
                $searchInput.value = ''
            })

        },
        function () { }
    )
})

fetchClients()
