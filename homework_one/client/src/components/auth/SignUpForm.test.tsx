import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SignUpForm } from './SignUpForm';
import { AuthCard } from './AuthCard';

describe('SignUpForm', () => {
  it('renders name, email, and password fields', () => {
    render(<SignUpForm onSubmit={vi.fn()} />);
    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
  });

  it('shows email error after blur with invalid value', async () => {
    const user = userEvent.setup();
    render(<SignUpForm onSubmit={vi.fn()} />);

    const email = screen.getByLabelText(/email/i);
    await user.type(email, 'not-an-email');
    await user.tab();

    expect(await screen.findByText(/that doesn't look right/i)).toBeInTheDocument();
  });

  it('keeps submit disabled while the form is invalid and enables it once filled correctly', async () => {
    const user = userEvent.setup();
    render(<SignUpForm onSubmit={vi.fn()} />);

    const submit = screen.getByRole('button', { name: /create account/i });
    expect(submit).toBeDisabled();

    await user.type(screen.getByLabelText(/full name/i), 'Jane Doe');
    await user.type(screen.getByLabelText(/email/i), 'jane@example.com');
    await user.type(screen.getByLabelText(/^password$/i), 'Pass123');

    expect(submit).toBeEnabled();
  });

  it('submit calls onSubmit with trimmed name, raw email, and password', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<SignUpForm onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText(/full name/i), '  Jane Doe  ');
    await user.type(screen.getByLabelText(/email/i), 'jane@example.com');
    await user.type(screen.getByLabelText(/^password$/i), 'Pass123');
    await user.click(screen.getByRole('button', { name: /create account/i }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledWith({
      name: 'Jane Doe',
      email: 'jane@example.com',
      password: 'Pass123',
    });
  });

  it('shows inline email error when emailError prop is set (e.g. 409 from API)', () => {
    render(
      <SignUpForm
        onSubmit={vi.fn()}
        emailError="That email is already in use. Try signing in instead."
      />,
    );
    expect(
      screen.getByText(/that email is already in use\. try signing in instead\./i),
    ).toBeInTheDocument();
  });
});

describe('SignUpForm inside AuthCard — Switch to Sign in affordance', () => {
  it('clicking "Switch to Sign in" pre-fills the SignInForm with the typed email', async () => {
    const user = userEvent.setup();
    // Pretend the parent has set emailError + duplicateEmailHint after a 409.
    render(
      <AuthCard
        onSignUp={vi.fn()}
        onSignIn={vi.fn()}
        signUpEmailError="That email is already in use. Try signing in instead."
        signUpDuplicateEmailHint="dup@example.com"
      />,
    );

    const switchBtn = screen.getByRole('button', { name: /switch to sign in/i });
    await user.click(switchBtn);

    await waitFor(() =>
      expect(screen.getByRole('heading', { name: /welcome back/i })).toBeInTheDocument(),
    );
    const emailInput = screen.getByLabelText(/email/i) as HTMLInputElement;
    expect(emailInput.value).toBe('dup@example.com');
  });
});
