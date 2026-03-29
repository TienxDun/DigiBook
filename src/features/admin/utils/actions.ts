import toast from '@/shared/utils/toast';

export const confirmAdminAction = (message: string) => window.confirm(message);

export const handleAdminAction = async <T>({
  action,
  successMessage,
  errorMessage,
}: {
  action: () => Promise<T>;
  successMessage?: string;
  errorMessage?: string;
}) => {
  try {
    const result = await action();
    if (successMessage) toast.success(successMessage);
    return result;
  } catch (error) {
    if (errorMessage) toast.error(errorMessage);
    throw error;
  }
};
