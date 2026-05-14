import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SignInForm } from './SignInForm';

describe('SignInForm', () => {
  it('Remember-me toggle drives the second argument to onSubmit', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<SignInForm onSubmit={onSubmit} />);

    // Default is checked → first submission passes remember: true.
    await user.type(screen.getByLabelText(/email/i), 'jane@example.com');
    await user.type(screen.getByLabelText(/^password$/i), 'Pass123');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    expect(onSubmit).toHaveBeenLastCalledWith({
      email: 'jane@example.com',
      password: 'Pass123',
      remember: true,
    });

    // Uncheck → second submission passes remember: false.
    await user.click(screen.getByLabelText(/remember me/i));
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    expect(onSubmit).toHaveBeenLastCalledWith({
      email: 'jane@example.com',
      password: 'Pass123',
      remember: false,
    });
  });

  it('shows the form-level error banner when formError is set', () => {
    render(
      <SignInForm onSubmit={vi.fn()} formError="That doesn't match our records." />,
    );
    expect(screen.getByRole('alert')).toHaveTextContent(/that doesn't match our records/i);
  });

  it('typing in any field clears the form-level error via onClearError', async () => {
    const user = userEvent.setup();
    const onClearError = vi.fn();
    render(
      <SignInForm
        onSubmit={vi.fn()}
        formError="That doesn't match our records."
        onClearError={onClearError}
      />,
    );

    await user.type(screen.getByLabelText(/email/i), 'a');
    expect(onClearError).toHaveBeenCalled();
  });

  it('disables submit until email is valid and password ≥ 6 chars', async () => {
    const user = userEvent.setup();
    render(<SignInForm onSubmit={vi.fn()} />);

    const submit = screen.getByRole('button', { name: /sign in/i });
    expect(submit).toBeDisabled();

    await user.type(screen.getByLabelText(/email/i), 'jane@example.com');
    await user.type(screen.getByLabelText(/^password$/i), 'short');
    expect(submit).toBeDisabled();

    await user.type(screen.getByLabelText(/^password$/i), 'er'); // now 7 chars
    expect(submit).toBeEnabled();
  });
});
