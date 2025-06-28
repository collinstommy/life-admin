"""
title: Life Admin Logs
author: Tom Collins
description: Fetches daily logs from Life Admin API
required_open_webui_version: 0.4.0
requirements: requests
version: 0.1.0
licence: MIT
"""

from pydantic import BaseModel, Field
import requests
import json
from typing import List, Dict, Any


class Tools:
    def __init__(self):
        """Initialize the Tool."""
        self.valves = self.Valves()

    class Valves(BaseModel):
        api_key: str = Field("", description="API key for life-admin logs access")

    def fetch_logs(self) -> str:
        """
        Fetches daily logs from the Life Admin API

        Returns a JSON string of daily log entries
        """
        if not self.valves.api_key:
            return "Error: API key not configured"

        try:
            headers = {"X-API-Key": self.valves.api_key}
            response = requests.get(
                "https://life-admin.tomascollins.workers.dev/logs", headers=headers
            )

            if response.status_code != 200:
                raise Exception(
                    f"API request failed with status {response.status_code}"
                )

            # Convert the response to a string for OpenWebUI
            data = response.json()
            print(f"Debug - Received data: {data}")  # Debug log
            return json.dumps(data, indent=2)

        except Exception as e:
            return f"Error fetching logs: {str(e)}"
