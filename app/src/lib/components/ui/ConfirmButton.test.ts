import { fireEvent, render, screen } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vitest';
import ConfirmButton from './ConfirmButton.svelte';

describe('ConfirmButton', () => {
  it('demande un second appui avant d’agir', async () => {
    const onconfirm = vi.fn();
    render(ConfirmButton, { label: 'Renaître', onconfirm });
    const button = screen.getByRole('button', { name: 'Renaître' });
    await fireEvent.click(button);
    expect(onconfirm).not.toHaveBeenCalled();
    expect(button).toHaveTextContent('Toucher encore pour confirmer');
    await fireEvent.click(button);
    expect(onconfirm).toHaveBeenCalledOnce();
    expect(button).toHaveTextContent('Renaître');
  });

  it('se désarme tout seul après le délai', async () => {
    vi.useFakeTimers();
    render(ConfirmButton, { label: 'Effacer', onconfirm: vi.fn(), timeout: 1000 });
    const button = screen.getByRole('button');
    await fireEvent.click(button);
    await vi.advanceTimersByTimeAsync(1100);
    expect(button).toHaveTextContent('Effacer');
    vi.useRealTimers();
  });

  it('reste inactif quand il est désactivé', () => {
    render(ConfirmButton, { label: 'Ascension', disabled: true, onconfirm: vi.fn() });
    expect(screen.getByRole('button')).toBeDisabled();
  });
});
