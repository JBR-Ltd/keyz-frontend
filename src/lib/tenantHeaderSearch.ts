const TENANT_HEADER_SEARCH_EVENT = "rello-tenant-header-search";

interface TenantHeaderSearchDetail {
  visible: boolean;
}

export function publishTenantHeaderSearch(visible: boolean): void {
  window.dispatchEvent(
    new CustomEvent<TenantHeaderSearchDetail>(TENANT_HEADER_SEARCH_EVENT, {
      detail: { visible },
    }),
  );
}

export function subscribeTenantHeaderSearch(
  listener: (visible: boolean) => void,
): () => void {
  const handleVisibilityChange = (event: Event): void => {
    const detail = (event as CustomEvent<unknown>).detail;

    if (
      typeof detail !== "object" ||
      detail === null ||
      !("visible" in detail) ||
      typeof detail.visible !== "boolean"
    ) {
      return;
    }

    listener(detail.visible);
  };

  window.addEventListener(TENANT_HEADER_SEARCH_EVENT, handleVisibilityChange);

  return () => {
    window.removeEventListener(
      TENANT_HEADER_SEARCH_EVENT,
      handleVisibilityChange,
    );
  };
}
