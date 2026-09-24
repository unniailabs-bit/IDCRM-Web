# URL Routing for Identity Card Templates

After setting up the React Router, you can access both templates via the following URLs:

## URLs

### Home Page
- **URL**: `http://localhost:5173/` or `/`
- **Description**: Landing page with links to both templates

### Template 1
- **URL**: `http://localhost:5173/template1` or `/template1`
- **Description**: Classic identity card design with student details

### Template 2
- **URL**: `http://localhost:5173/template2` or `/template2`
- **Description**: Modern identity card design with emergency contact

## Setup Instructions

1. **Install dependencies** (including react-router-dom):
   ```bash
   npm install
   ```

2. **Start the development server**:
   ```bash
   npm run dev
   ```

3. **Access the application**:
   - The app will be available at `http://localhost:5173` (or the port shown in terminal)
   - Navigate to:
     - `/` - Home page
     - `/template1` - Template 1
     - `/template2` - Template 2

## Navigation

The application includes a navigation bar at the top with links to:
- Home
- Template 1
- Template 2

## Production Build

For production, build the app:
```bash
npm run build
```

The routes will work the same way in production. Make sure your hosting provider supports client-side routing (or configure it for React Router).

## Example URLs in Production

If deployed to `https://yourdomain.com`:
- `https://yourdomain.com/` - Home
- `https://yourdomain.com/template1` - Template 1
- `https://yourdomain.com/template2` - Template 2

