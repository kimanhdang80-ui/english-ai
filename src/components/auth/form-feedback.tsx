import { Alert, AlertDescription } from '@/components/ui/alert';
import type { ActionState } from '@/lib/auth/actions';

/** Renders top-level success/error feedback from an action's state. */
export function FormFeedback({ state }: { state: ActionState }) {
  if (state.success) {
    return (
      <Alert variant="success">
        <AlertDescription>{state.success}</AlertDescription>
      </Alert>
    );
  }
  if (state.error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{state.error}</AlertDescription>
      </Alert>
    );
  }
  return null;
}

/** Renders per-field validation errors under an input. */
export function FieldError({
  state,
  field,
}: {
  state: ActionState;
  field: string;
}) {
  const errors = state.fieldErrors?.[field];
  if (!errors?.length) return null;
  return (
    <p className="text-sm text-destructive" role="alert">
      {errors[0]}
    </p>
  );
}
