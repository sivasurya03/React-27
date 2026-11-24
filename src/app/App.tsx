import { MotionConfig } from 'framer-motion';
import { RouterProvider } from 'react-router-dom';
import { ToastProvider } from '@/components/ui';
import { useBootstrapData } from '@/hooks/useBootstrapData';
import { router } from '@/routes';
import { ThemeProvider } from './ThemeProvider';

export default function App() {
  useBootstrapData();
  return (
    <MotionConfig reducedMotion="user">
      <ThemeProvider>
        <ToastProvider>
          <RouterProvider router={router} />
        </ToastProvider>
      </ThemeProvider>
    </MotionConfig>
  );
}
