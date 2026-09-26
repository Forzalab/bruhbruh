import base from './vite.config.js';
// T4 only: node_modules is a symlink to the main checkout; let Vite serve its files (fonts).
export default { ...base, server: { fs: { allow: ['.', '/home/user/gates_of_babylon/node_modules'] } } };
