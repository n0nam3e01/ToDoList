'use strict';
const STORAGE_KEY = 'po-delu.tasks.v1';
let tasks = [];
let filter = 'all';
let editingId = null;
const $ = (selector) => document.querySelector(selector);
const status = $('#status');
try {
  const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  if (!Array.isArray(stored)) throw new Error('Invalid tasks');
  tasks = stored.filter(t => t && typeof t.id === 'string' && typeof t.title === 'string' && t.title.trim() && typeof t.done === 'boolean').map(t => ({id:t.id,title:t.title.slice(0,300),done:t.done}));
} catch {
  status.textContent = 'Не удалось прочитать сохранённые задачи. Новые задачи можно добавлять.';
}
$('#date').textContent = new Intl.DateTimeFormat('ru-RU', {day:'numeric',month:'long',weekday:'short'}).format(new Date());
function save() {
  try {localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));status.textContent = '';}
  catch {status.textContent = 'Не удалось сохранить задачи. Они будут доступны до закрытия страницы.';}
}
const icons = {
  edit:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="m16 3 5 5-12 12-6 1 1-6Z"/><path d="m14 5 5 5"/></svg>',
  delete:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7M14 10v7"/></svg>'
};
function render() {
  const list = $('#task-list');list.replaceChildren();
  const done = tasks.filter(t => t.done).length;
  $('#total').textContent = tasks.length;
  $('#active-count').textContent = tasks.length - done;
  $('#done-count').textContent = done;
  $('#progress-text').textContent = tasks.length ? `${done} из ${tasks.length} выполнено` : 'Всё впереди';
  const percent = tasks.length ? Math.round(done / tasks.length * 100) : 0;
  $('#progress-fill').style.width = `${percent}%`;
  $('.progress').setAttribute('aria-valuenow',percent);
  $('#clear').hidden = done === 0;
  const visible = tasks.filter(t => filter === 'all' || (filter === 'done' ? t.done : !t.done));
  $('#empty').hidden = visible.length > 0;
  $('#empty h3').textContent = tasks.length === 0 ? 'Здесь начинается порядок' : filter === 'active' ? 'Всё сделано!' : 'Пока нет выполненных задач';
  $('#empty p').textContent = tasks.length === 0 ? 'Добавьте первую задачу и освободите голову.' : filter === 'active' ? 'Можно выдохнуть или добавить новую задачу.' : 'Отметьте задачу, когда закончите её.';
  for (const task of visible) {
    const item = document.createElement('li');item.className = `task${task.done ? ' done' : ''}`;
    const checkbox = document.createElement('input');checkbox.type = 'checkbox';checkbox.className = 'task-check';checkbox.checked = task.done;checkbox.setAttribute('aria-label',`Выполнено: ${task.title}`);
    checkbox.addEventListener('change',() => {task.done = checkbox.checked;save();render();});
    const title = document.createElement('span');title.className = 'task-title';title.textContent = task.title;
    const actions = document.createElement('div');actions.className = 'task-actions';
    for (const action of ['edit','delete']) {
      const button = document.createElement('button');button.type = 'button';button.className = `icon-button ${action}`;button.innerHTML = icons[action];button.setAttribute('aria-label',`${action === 'edit' ? 'Изменить' : 'Удалить'}: ${task.title}`);
      button.addEventListener('click',() => {
        if (action === 'delete') {tasks = tasks.filter(t => t.id !== task.id);save();render();$('#task-input').focus();}
        else {editingId = task.id;$('#edit-input').value = task.title;$('#edit-dialog').showModal();$('#edit-input').focus();}
      });actions.append(button);
    }
    item.append(checkbox,title,actions);list.append(item);
  }
}
$('#add-form').addEventListener('submit',event => {
  event.preventDefault();const input = $('#task-input');const title = input.value.trim();
  if (!title) {input.setCustomValidity('Введите название задачи.');input.reportValidity();return;}
  tasks.unshift({id:crypto.randomUUID(),title,done:false});filter = 'all';updateFilters();save();render();input.value = '';input.focus();
});
$('#task-input').addEventListener('input',event => event.target.setCustomValidity(''));
function updateFilters() {document.querySelectorAll('[data-filter]').forEach(button => button.setAttribute('aria-pressed',String(button.dataset.filter === filter)));}
document.querySelectorAll('[data-filter]').forEach(button => button.addEventListener('click',() => {filter = button.dataset.filter;updateFilters();render();}));
$('#clear').addEventListener('click',() => {tasks = tasks.filter(t => !t.done);save();render();});
$('#cancel-edit').addEventListener('click',() => $('#edit-dialog').close());
$('#edit-form').addEventListener('submit',event => {
  event.preventDefault();const input = $('#edit-input');const title = input.value.trim();
  if (!title) {input.setCustomValidity('Введите название задачи.');input.reportValidity();return;}
  const task = tasks.find(t => t.id === editingId);if (task) task.title = title;
  save();render();$('#edit-dialog').close();$('#task-input').focus();
});
$('#edit-input').addEventListener('input',event => event.target.setCustomValidity(''));
window.addEventListener('storage',event => {if (event.key === STORAGE_KEY) location.reload();});
render();
