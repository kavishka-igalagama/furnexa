import { useCallback, useState } from "react";

type MutationState<TData> = {
  data: TData | null;
  error: Error | null;
  isPending: boolean;
};

export const useMutation = <TData, TVariables>(
  mutationFn: (variables: TVariables) => Promise<TData>,
) => {
  const [state, setState] = useState<MutationState<TData>>({
    data: null,
    error: null,
    isPending: false,
  });

  const mutateAsync = useCallback(
    async (variables: TVariables) => {
      setState({ data: null, error: null, isPending: true });
      try {
        const data = await mutationFn(variables);
        setState({ data, error: null, isPending: false });
        return data;
      } catch (error) {
        const nextError =
          error instanceof Error ? error : new Error("Unknown error");
        setState({ data: null, error: nextError, isPending: false });
        throw nextError;
      }
    },
    [mutationFn],
  );

  const mutate = useCallback(
    (variables: TVariables) => {
      void mutateAsync(variables);
    },
    [mutateAsync],
  );

  return {
    mutate,
    mutateAsync,
    data: state.data,
    error: state.error,
    isPending: state.isPending,
  };
};
