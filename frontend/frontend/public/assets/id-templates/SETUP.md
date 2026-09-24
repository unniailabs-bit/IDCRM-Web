# Setup Instructions

## Fix npm Permissions Issue

If you're getting npm permission errors, run this command in your terminal:

```bash
sudo chown -R 501:20 "/Users/aneeshm/.npm"
```

You'll be prompted for your password.

## Install Dependencies

After fixing permissions, install the dependencies:

```bash
npm install
```

## Alternative: Use npx (No Installation Required)

If you want to run the project without installing globally, you can use:

```bash
npx vite
```

## Run the Development Server

```bash
npm run dev
```

## Alternative Setup (Without npm)

If npm continues to have issues, you can:

1. **Use the component directly** - The `IdentityCard.jsx` and `IdentityCard.css` files can be imported into any React project
2. **Use Create React App** - Create a new React app and copy the component files:
   ```bash
   npx create-react-app my-app
   # Then copy IdentityCard.jsx and IdentityCard.css to src/
   ```
3. **Use Next.js** - Similar approach with Next.js

## Quick Start (After npm install works)

1. Fix npm permissions (see above)
2. Run `npm install`
3. Run `npm run dev`
4. Open the URL shown in terminal (usually http://localhost:5173)

