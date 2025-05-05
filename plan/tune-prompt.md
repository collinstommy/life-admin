## Duplicate info in notes

Notes should not include duplicate information. For example if type is run and distance is 5 kilometers, then notes should not include "5 kilometers". Notes should only include additional information not captured by another field

Here is an example of how this is currently handled. We need to improve on this:

Transcript:
Today I went for a 5 kilometer run. I did yoga, medium intensity, 45 minutes. Bean burrito for lunch. For dinner, I had a quiche with some salad. For breakfast, I had overnight oats with granola.

Structured data:
```
"workouts": [
    {
      "type": "run",
      "durationMinutes": null,
      "distanceKm": 5,
      "intensity": null,
      "notes": "5 kilometer run"
    },
    {
      "type": "yoga",
      "durationMinutes": 45,
      "distanceKm": null,
      "intensity": 5,
      "notes": "medium intensity"
    }
  ]
```

## Commute
Unless otherwise specified, the commute should be 5 kilometers and type should be city cycling. Default to 5 intencity if not specified.
