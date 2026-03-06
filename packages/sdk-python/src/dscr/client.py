"""Minimal hand-written client. Will be augmented by generated code."""

from __future__ import annotations

import httpx


class DscrApiError(Exception):
    def __init__(self, status: int, body: dict) -> None:
        self.status = status
        self.body = body
        super().__init__(f"API request failed with status {status}")


class DscrClient:
    def __init__(self, api_key: str, base_url: str = "https://pricingengine.pro") -> None:
        self._base_url = base_url
        self._client = httpx.Client(
            base_url=base_url,
            headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
        )

    def list_deals(self, *, status: str | None = None, page: int = 1, per_page: int = 25) -> dict:
        params = {"page": page, "per_page": per_page}
        if status:
            params["status"] = status
        return self._request("GET", "/api/deals", params=params)

    def create_deal(self, deal_inputs: list[dict]) -> dict:
        return self._request("POST", "/api/deals", json={"deal_inputs": deal_inputs})

    def search_borrowers(self, q: str) -> dict:
        return self._request("GET", "/api/applicants/borrowers", params={"q": q})

    def _request(self, method: str, path: str, **kwargs) -> dict:
        response = self._client.request(method, path, **kwargs)
        if not response.is_success:
            raise DscrApiError(response.status_code, response.json())
        return response.json()

    def close(self) -> None:
        self._client.close()

    def __enter__(self) -> "DscrClient":
        return self

    def __exit__(self, *args) -> None:
        self.close()
