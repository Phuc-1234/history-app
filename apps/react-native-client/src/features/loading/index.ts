/**
 * CUSTOM GLOBAL LOADING FEATURE (Duolingo Style)
 * 
 * How to use:
 * 1. Wrap the root of the app in <LoadingProvider> (already configured inside _layout.tsx).
 * 2. Import `useLoading` from `@/features/loading` in any screen or hook.
 * 3. Call `const { showLoading, hideLoading } = useLoading();`.
 * 4. Call `showLoading()` before initiating long tasks (e.g. login submission).
 * 5. Call `hideLoading()` in the target page's resolution mount (e.g. inside `useEffect` on home screen).
 */

export { LoadingProvider, useLoading } from "./loadingContext";
export { default as SpecialLoading } from "./components/SpecialLoading";
