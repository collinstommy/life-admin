# AI Coach Requirements Specification

## Overview
The AI Coach is a personalized health and fitness guidance system that leverages existing health tracking data to provide actionable insights, recommendations, and goal-setting assistance.

## Functional Requirements

### 1. User Profile Management
- **FR-001**: One-time profile setup with minimal data entry
  - Required fields: age, gender, height, weight, goals (free text), activity level (free text)
  - Optional fields: none initially
  - BMI auto-calculation based on height/weight

### 2. AI Coach Interface
- **FR-002**: Dedicated "Coach" tab in the application
- **FR-003**: Weekly insight generation every Sunday
- **FR-004**: Display format: 3 insights + 2 recommendations + 1 habit focus
- **FR-005**: Read/unread status tracking for insights

### 3. Data Analysis
- **FR-006**: Analyze existing health data (workouts, meals, sleep, mood, etc.)
- **FR-007**: Generate personalized insights based on patterns
- **FR-008**: Create actionable weekly recommendations
- **FR-009**: Suggest small, achievable habit changes

### 4. Goal Management
- **FR-010**: Simple goal setting (free text input)
- **FR-011**: AI breaks goals into weekly milestones
- **FR-012**: Progress tracking without visual complexity

## Non-Functional Requirements

### Performance
- **NFR-001**: Insight generation must complete within 5 seconds
- **NFR-002**: Support concurrent users without performance degradation

### Security
- **NFR-003**: User profile data encrypted at rest
- **NFR-004**: No sensitive medical data storage

### Usability
- **NFR-005**: Zero additional data entry beyond initial profile
- **NFR-006**: Mobile-responsive interface
- **NFR-007**: Encouraging, non-judgmental tone

## Data Requirements
- Health logs (workouts, meals, sleep, mood, etc.)
- User profile data
- AI-generated insights and recommendations
- Historical analysis data

## Integration Points
- Existing health tracking system
- Cloudflare AI for analysis
- Cloudflare D1 database
- React frontend components