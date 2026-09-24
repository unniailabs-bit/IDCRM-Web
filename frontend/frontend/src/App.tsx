import { AppRoutes } from './routes/AppRoutes';
import { Toaster } from './components/ui/sonner';

export default function App() {
  // console.log('App: Component rendered.');
  return (
    <>
      <AppRoutes />
      <Toaster position="top-center" />
    </>
  );
}
