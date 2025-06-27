
## Brief

I want to create a new feature that records my voice on a web page. The recording will be a log of my activites for a given day. It will include the date as well as information on:
- Meals
- Exercise
- Sleep
- Water intake
- Pain/discomfort
- Mood
- Weight

This information needs to be recorded in a way that is easy to read and understand for an AI assistant. This will be used as a tool for an AI.

I currently have a basic verison working that relies on notion to store the data. My app then returns this as json array with the data and content.
Here are some example entries:

```json
[
  {
    "date": "2025-04-08",
    "content": {
      "parent": "\n## Screen Time\n\n- Screen time in hours:\n\n## Workout\n\n\n| **Type** | **Duration (minutes)**: | **Intensity (rating out of 10)**: | **Notes** |\n| -------- | ----------------------- | --------------------------------- | --------- |\n|          |                         |                                   |           |\n|          |                         |                                   |           |\n|          |                         |                                   |           |\n\n\n## Nutrition\n\n\n| **Meal**       | **Notes** |\n| -------------- | --------- |\n| Breakfast      | Over      |\n| Lunch          |           |\n| Dinner         |           |\n| Snacks         |           |\n| Coffee in cups |           |\n\n- **Water Intake (litres)**:\n\n## Pain/Discomfort\n\n- **Location**:\n- **Intensity (rating out of 10)**:\n- **Notes**:\n\n## Sleep\n\n- **Hours**:\n- **Quality (rating out of 10)**:\n\n## Energy Levels\n\n- **Daily (rating out of 10)**:\n\n## Mood\n\n- **Rating (out of 10)**:\n- **Notes**:\n\n## Progress\n\n- **Weight (kg)**:\n\n## Other Activities\n\n- \n\n## Notes\n\n- \n"
    }
  },
  {
    "date": "2025-04-07",
    "content": {
      "parent": "\n## Screen Time\n\n- Screen time in hours:\n\n## Workout\n\n\n| **Type**               | **Duration (minutes)**: | **Intensity (rating out of 10)**: | **Notes**       |\n| ---------------------- | ----------------------- | --------------------------------- | --------------- |\n| intermediate yoga flow | 45                      | 7                                 | difficult class |\n|                        |                         |                                   |                 |\n|                        |                         |                                   |                 |\n\n\n## Nutrition\n\n\n| **Meal**       | **Notes**                                |\n| -------------- | ---------------------------------------- |\n| Breakfast      | overnight oats with 1 tablespoon granola |\n| Lunch          | bean burrito with salad                  |\n| Dinner         | massaman curry with brown rice           |\n| Snacks         | 30g chocolate                            |\n| Coffee in cups | 2                                        |\n\n- **Water Intake (litres)**: 3\n\n## Pain/Discomfort\n\n- **Location**:\n- **Intensity (rating out of 10)**:\n- **Notes**:\n\n## Sleep\n\n- **Hours**:\n- **Quality (rating out of 10)**:\n\n## Energy Levels\n\n- **Daily (rating out of 10)**:\n\n## Mood\n\n- **Rating (out of 10)**:\n- **Notes**:\n\n## Progress\n\n- **Weight (kg)**:\n\n## Other Activities\n\n- \n\n## Notes\n\n- \n"
    }
  },
  {
    "date": "2025-04-05",
    "content": {
      "parent": "\n## Screen Time\n\n- Screen time in hours:\n\n## Workout\n\n\n| **Type**          | **Duration (minutes)**: | **Intensity (rating out of 10)**: | **Notes** |\n| ----------------- | ----------------------- | --------------------------------- | --------- |\n| Physio exercises  | 30                      | 7                                 |           |\n|                   |                         |                                   |           |\n|                   |                         |                                   |           |\n\n\n## Nutrition\n\n\n| **Meal**       | **Notes**                               |\n| -------------- | --------------------------------------- |\n| Breakfast      | Toast                                   |\n| Lunch          | Potatoe salad, cheese, black bean salad |\n| Dinner         | Roast dinner                            |\n| Snacks         | Cake slice                              |\n| Coffee in cups | 2                                       |\n\n- **Water Intake (litres)**: 1\n\n## Pain/Discomfort\n\n- **Location**:\n- **Intensity (rating out of 10)**:\n- **Notes**:\n\n## Sleep\n\n- **Hours**: 9\n- **Quality (rating out of 10)**: 9\n\n## Energy Levels\n\n- **Daily (rating out of 10)**: 9\n\n## Mood\n\n- **Rating (out of 10)**: 8\n- **Notes**:\n\n## Progress\n\n- **Weight (kg)**:\n\n## Other Activities\n\n- Family time\n\n## Notes\n\n- In mallow\n"
    }
  },
]
```

## Phases
1. Create basic app to record voice, store data
2. Create endpoint to consume data
3. Create UI to chat when making the recording

## Tech Considerations
- Save voice recording to R2 bucket
- Tech stack
  - Cloudflare Workers with Hono
  - Cloudflare R2
  - Cloudflare Whisper for voice recognition

## Excis
