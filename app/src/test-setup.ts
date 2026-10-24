import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/svelte';
import { afterEach } from 'vitest';

// Sans les globals de Vitest, Testing Library ne démonte pas les composants tout seul.
afterEach(() => cleanup());
