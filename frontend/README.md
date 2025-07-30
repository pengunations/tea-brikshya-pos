# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

To launch your POS app, follow these steps (since your backend and frontend are already set up):

1. **Start the backend server**  
Open a terminal and run:
```sh
cd /Users/nancy/Documents/FinalPOS/backend
npm start
```
You should see:  
`Server running on http://localhost:4000`

2. **Start the Electron app (frontend)**  
In a new terminal window/tab, run:
```sh
cd /Users/nancy/Documents/FinalPOS/frontend
npm run electron-dev
```
This will open the desktop POS app.  
Alternatively, you can use the web version at [http://localhost:5173/](http://localhost:5173/) by running:
```sh
npm run dev
```
in the `frontend` folder.

**Login using:**
- Username: `admin` / Password: `admin123`
- or Username: `cashier` / Password: `cashier123`

Let me know if you want me to run these commands for you, or if you encounter any issues!
