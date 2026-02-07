import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ToggleControl from './ToggleControl';

describe('ToggleControl', () => {
  it('should render in desktop mode (checkbox)', () => {
    const onChange = vi.fn();
    render(
      <ToggleControl
        id="test-toggle"
        checked={false}
        onChange={onChange}
        useMobileStyle={false}
      />
    );

    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeInTheDocument();
    expect(checkbox).not.toBeChecked();
  });

  it('should render in mobile mode (button)', () => {
    const onChange = vi.fn();
    render(
      <ToggleControl
        id="test-toggle"
        checked={false}
        onChange={onChange}
        useMobileStyle={true}
      />
    );

    const button = screen.getByRole('button', { name: /off/i });
    expect(button).toBeInTheDocument();
  });

  it('should show "On" text when checked in mobile mode', () => {
    const onChange = vi.fn();
    render(
      <ToggleControl
        id="test-toggle"
        checked={true}
        onChange={onChange}
        useMobileStyle={true}
      />
    );

    expect(screen.getByText('On')).toBeInTheDocument();
  });

  it('should show "Off" text when unchecked in mobile mode', () => {
    const onChange = vi.fn();
    render(
      <ToggleControl
        id="test-toggle"
        checked={false}
        onChange={onChange}
        useMobileStyle={true}
      />
    );

    expect(screen.getByText('Off')).toBeInTheDocument();
  });

  it('should call onChange when clicked in desktop mode', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <ToggleControl
        id="test-toggle"
        checked={false}
        onChange={onChange}
        useMobileStyle={false}
      />
    );

    const checkbox = screen.getByRole('checkbox');
    await user.click(checkbox);

    expect(onChange).toHaveBeenCalledWith(true);
  });

  it('should call onChange when clicked in mobile mode', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <ToggleControl
        id="test-toggle"
        checked={false}
        onChange={onChange}
        useMobileStyle={true}
      />
    );

    const button = screen.getByRole('button');
    await user.click(button);

    expect(onChange).toHaveBeenCalledWith(true);
  });

  it('should be disabled when disabled prop is true', () => {
    const onChange = vi.fn();
    render(
      <ToggleControl
        id="test-toggle"
        checked={false}
        onChange={onChange}
        disabled={true}
        useMobileStyle={false}
      />
    );

    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeDisabled();
  });

  it('should not call onChange when disabled and clicked', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <ToggleControl
        id="test-toggle"
        checked={false}
        onChange={onChange}
        disabled={true}
        useMobileStyle={true}
      />
    );

    const button = screen.getByRole('button');
    await user.click(button);

    expect(onChange).not.toHaveBeenCalled();
  });

  it('should toggle from checked to unchecked', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <ToggleControl
        id="test-toggle"
        checked={true}
        onChange={onChange}
        useMobileStyle={false}
      />
    );

    const checkbox = screen.getByRole('checkbox');
    await user.click(checkbox);

    expect(onChange).toHaveBeenCalledWith(false);
  });
});
