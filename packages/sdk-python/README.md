# dscr-sdk

Python SDK for the dscr.ai API.

## Usage

```python
from dscr import DscrClient

client = DscrClient(api_key="your-api-key")
deals = client.list_deals(status="active")
```
