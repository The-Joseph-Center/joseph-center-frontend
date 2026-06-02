import { createApp } from 'vue';
import { createPinia } from 'pinia';
import { createHead } from '@unhead/vue';
import App from './App.vue';
import router from './router';
import './assets/styles/main.css';
import './assets/styles/scroll-animations.css';

const app = createApp(App);
const pinia = createPinia();
const head = createHead();

app.use(pinia);
app.use(router);
app.use(head);

app.mount('#app');

// Allow Space key to activate links (a tags) for keyboard accessibility.
// Native <a> elements only respond to Enter; this adds Space parity with <button>.
document.addEventListener('keydown', (e) => {
  if (e.key === ' ' && e.target instanceof HTMLAnchorElement) {
    e.preventDefault();
    e.target.click();
  }
});

