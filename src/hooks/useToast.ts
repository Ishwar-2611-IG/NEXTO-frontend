import { ToastContext } from '../context/toastContext';
import { useRequiredContext } from './useRequiredContext';

export const useToast = () => useRequiredContext(ToastContext, 'useToast');
