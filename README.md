### Your Product Name

**Team Name:** Stack OTTERflows

<img width="1500" height="500" alt="APSO (1)" src="https://github.com/user-attachments/assets/ef4aaa68-14ae-47b4-9b4a-42ec2988289c" />

### MEET THE TEAM

<img width="1500" height="500" alt="Screenshot 2026-03-07 at 11 24 58 am" src="https://github.com/user-attachments/assets/bfa0ee22-5a9a-4685-98db-65c4b28dd1b9" />
(From left to right): The Gals you OTTER hire ~ Becky Cole, Inano Knowles, Nancy Valentin, Mahounda Poinsonnet.


## Table of Contents

- [Your Product Name](#your-product-name)
  - [Table of Contents](#table-of-contents)
  - [Mission Statement](#mission-statement)
  - [Features](#features)
    - [Summary](#summary)
    - [Users](#users)
    - [Collections](#collections)
    - [Pages/Endpoint Functionality](#pagesendpoint-functionality)
    - [Nice To Haves](#nice-to-haves)
  - [Technical Implementation](#technical-implementation)
    - [Back-End](#back-end)
    - [Front-End](#front-end)
    - [Git \& Deployment](#git--deployment)
  - [Target Audience](#target-audience)
  - [Back-end Implementation](#back-end-implementation)
    - [API Specification](#api-specification)
    - [Object Definitions](#object-definitions)
      - [Users](#users-1)
    - [Database Schema](#database-schema)
  - [Front-end Implementation](#front-end-implementation)
    - [Wireframes](#wireframes)
    - [Logo](#logo)
    - [Colours](#colours)
    - [Font](#font)


## Mission Statement

Accountability Pods empowers individuals to achieve meaningful goals through shared commitment and community support. 
Users join invite only groups centred on goals such as fitness, learning or career development. 
Through goal setting, regular check ins and progress tracking, the platform strengthens accountability while fostering motivation, engagement and the celebration of milestones together.

The **primary audience for Phase 1** is _individuals_ who want structured accountability while working toward personal goals.
Users create goals and connect with a trusted verification buddy who confirms their progress.
Future versions will extend the platform to support group accountability pods and collaborative goal tracking.

## Features

> [!NOTE]  
> The features outlined below are subject to change in response to client feedback, evolving project requirements, or development constraints.

### Summary

Accountability Pods enables individuals to stay consistent with their personal goals through a structured and supportive accountability process. Users can create personal goals, connect with a trusted accountability buddy, and submit regular check-ins to record their progress. Each check-in is reviewed by the assigned buddy, who can approve or reject the submission to verify that meaningful progress has been made. By combining goal setting, progress tracking, and external verification, the platform encourages honesty, consistency, and sustained personal growth. For the Phase 1 release, the focus is on delivering this core individual accountability workflow in a clear, reliable, and user-friendly way. Future versions of Accountability Pods will build on this foundation by introducing collaborative pods, shared dashboards, and additional community engagement features to support group-based accountability and broader participation.

### Specific MVP for Phase 1:
- User registration
- User login with token authentication
- View current user profile
- Update user profile
- Create personal goals
- View personal goals
- View goal details and check-in history
- Connect a verification buddy to a goal
- Accept or decline buddy requests
- Submit goal check-ins
- Approve check-ins (by buddy)
- Reject check-ins (by buddy)

### Users

| Type | Access | Role type assignment |
|------|------|------|
| Superuser or admin | - All access<br>- Can log in<br>- Can log out<br>- Create and manage pods<br>- Create and manage goal categories<br>- Create and manage other users<br>- Approve, archive, and edit check-ins<br>- Export data as CSV<br>- Can see and edit their details via profile page | Core Team: Becky, Inano, Nancy, and Mahounda |
| Approver | - Can log in<br>- Can log out<br>- Approve, archive, and edit check-ins within assigned pods<br>- Manage pod membership requests<br>- Can see and edit their details via profile page | Client: Lachlan; Mentors, volunteers, She Codes staff |
| Member | - Create and submit check-ins<br>- Join pods and set personal goals<br>- View pod dashboards and activity feeds<br>- Verify buddy progress<br>- Can see and edit their details via profile page | Registered users, students, professionals |
| Guest | - View landing page<br>- Browse public pods (read-only)<br>- Access registration and login pages | Public: Users interested in joining a pod |

### Sticky Notes

| Feature | Access | Notes/Conditions |
|---|---|---|
| Create | Members | - Log progress against an active personal or pod goal<br>- Option to include hashtags or categories (e.g., #fitness, #coding) |
| Post | Members | - Submits progress to the Pod activity feed<br>- Triggers a "Pending" status for verification |
| View | Members, Approvers, and Admins | - Members view via Pod Dashboard feed<br>- Admins/Approvers view via "Pending Verification" queue |
| Edit | Admins and Approvers | - Correct entry errors or adjust values before verification<br>- Ensure data integrity before the status is set to "Approved" |
| Statuses: Pending, Approved, Rejected, Archived | - Auto-status: Check-ins are "Pending" upon submission<br>- Verification: Updated to "Approved" or "Rejected" by Admins/Approvers or assigned Buddies | - Status change updates the goal progress bar and user streaks |
| Export | Admin only | - Export as CSV file<br>- Format: pod_name, goal_title, member_name, checkin_value, timestamp |
| Flag: Is Verified | Auto-flag | - Boolean: True once an Admin or Approver has finalised the check-in status |
| Link to Pod | Members | - Check-ins are automatically linked to the Pod from which they were submitted |
| Link to Goal | Members | - Users must select which specific Goal the check-in contributes towards |
| Link to Approver | Admin / Approver | - Records which Admin, Approver, or Buddy authorised the check-in for audit purposes |

### Collections

| Feature | Scope | Access | Notes / Conditions |
|---|---|---|---|
| Assign Pods to a Category | Group | Based on Pod topic | - Pods are grouped under a thematic category (e.g., "Coding", "Fitness", "Career Development").<br>- Helps organise pods on the Explore page and improves discoverability for members searching for relevant communities.<br>- Categories support easier filtering and navigation across the platform. |
| Assign Approver to a Category | Group | Admin (Core Team) | - Allows an Admin to assign an Approver (e.g., Lachlan or designated staff/mentors) responsibility for pods within a specific category.<br>- The assigned Approver can review, verify, and moderate check-ins for pods under that category.<br>- Helps distribute moderation responsibilities and ensures subject-matter oversight. |
| Default Goal Duration | Group | Admin (Core Team) | - Defines the standard cadence for goals created within pods of that category (e.g., Weekly, Monthly).<br>- Provides consistency across pods in the same theme and helps members track progress more effectively.<br>- Admins can configure these defaults when setting up or managing categories. |
| View Pod Dashboards by Category | Group | Admin, Approver | - Enables Admins and Approvers to view aggregated dashboards for all pods within a category.<br>- Displays progress summaries, member activity, and recent check-ins across multiple pods.<br>- Useful for monitoring engagement and identifying trends within a specific theme. |
| Export Check-ins by Category | Group | Admin (Core Team) | - Generates CSV reports containing check-in data filtered by Pod Category.<br>- Exported fields may include pod name, goal title, member name, check-in value, and timestamp.<br>- Supports reporting, analytics, and internal review by the Core Team. |
| Set Personal Goal | Individual | Members | - Each member defines their own target (e.g., "3 study sessions per week").<br>- Targets can vary between members even if they belong to the same pod.<br>- Personal goals contribute to individual progress tracking and accountability. |
| Private Progress | Individual | Members | - Check-ins contribute to a personal progress bar visible to the member.<br>- Personal streaks are calculated based on the individual's consistency.<br>- Encourages motivation through private goal tracking separate from pod-level metrics. |
| Buddy Assignment | Individual | Members / Admin | - Each member may be paired with a "Buddy" responsible for verifying their specific check-ins.<br>- Buddies help maintain accountability and ensure check-ins reflect genuine progress.<br>- Admins may override or assign buddies where necessary. |
| Member Leaderboard | Group | Pod Members | - Displays a ranking or list of members who have met or exceeded their personal targets for the current period.<br>- Encourages friendly competition and community engagement within the pod.<br>- Leaderboards may reset periodically (e.g., weekly or monthly). |
| Personalised Notifications | Individual | Members | - Automated reminders are sent based on the individual's goal deadlines.<br>- Notifications may include reminders to submit check-ins, progress updates, or streak alerts.<br>- Helps members stay consistent with their commitments. |

### Pages/Endpoint Functionality

| Endpoint | Functionality | Comments |
|---|---|---|
| Submit Check-in | - Members post progress updates to their Pod<br>- Toggle for Individual vs Group goal contribution<br>- Option to add numeric values, notes, and hashtags | - Sticky note style interface preferred for quick posting<br>- High contrast design and mobile responsive layout<br>- Real time character limit validation to guide concise updates |
| Pod Dashboard (Live Board) | - View live feed of check-in sticky notes<br>- Visualise progress bars (Individual streaks or Group totals)<br>- Search notes by text, member, or hashtag<br>- Daily cadences reset at midnight AEST | - Designed to feel like an interactive live board session<br>- Progress bars update dynamically when new check-ins are submitted<br>- Toggle between Individual progress view and Group progress view |
| Admin Dashboard | - All Superuser functions (Becky, Inano, Nancy, Mahounda)<br>- Create and manage Pod Categories (Collections)<br>- Manage all users and global system settings<br>- Export all data by Category or Pod as CSV | - Requires Superuser authentication<br>- Initial admin accounts created through database seed configuration during deployment |
| Register as Approver | - Users (Lachlan, Mentors) can register for oversight permissions<br>- Once approved they can log in to the Verification Queue | - Requires verified She Codes email address<br>- Final authorisation managed by the Core Team |
| Approver / Client Page | - Approver functions for Lachlan and Mentors<br>- Verify, edit, or reject pending check-in notes<br>- View aggregated pod data by Category | - Requires Approver authentication<br>- Interface optimised for quickly reviewing and verifying large volumes of submissions |
| Individual Pod View | - Focus on personal targets and Buddy pairings<br>- View personal consistency streaks and milestone progress | - Designed to support personal accountability and goal tracking<br>- Accessible to all registered pod members |
| Group Pod View | - Collaborative view of a shared group target<br>- Progress bar increases when any member submits a valid check-in | - Emphasises collective success within the pod<br>- Encourages collaboration and group motivation |
| Profile Page | - Accessible by all registered users (Admins, Approvers, Members)<br>- View personal history of check-ins and earned badges<br>- Update account information and notification preferences | - Requires authentication<br>- Serves as the central hub for individual achievements and activity metrics |

### Nice To Haves

- **The "Nudge" System and Notifications:** Automated notifications sent to a "Buddy" or Pod Admin if a member hasn't submitted a check-in within their defined timeframe.
- **Milestone Celebrations:** Interactive animations (e.g., confetti) or digital trophies triggered when a member hits a 7-day or 30-day consistency streak.
- **Pod Chat/Comments:** A dedicated space on the Pod Dashboard for members to leave words of encouragement on each other’s "sticky note" check-ins.
- **Public vs Private Pods:** The ability for members to create invite-only pods for sensitive goals or private coaching.
- **Interactive Charts:** Dynamic line graphs or heatmaps (similar to GitHub contribution calendars) to visualise activity trends over time.
- **Bulk Verification:** A "Select All" feature for Administrators to approve multiple pending check-ins simultaneously.
- **Custom Goal Metrics:** Allowing users to define unique units (e.g., "glasses of water" or "lines of code") instead of just binary "Done/Not Done" toggles.
- **Automated CSV Scheduling:** The ability for the Core Team to schedule weekly data exports to be sent directly to their email.
- **Dark Mode Toggle:** A high-contrast dark theme for users logging nightly check-ins.
- **Image Uploads:** Allowing members to attach a photo to their check-in card for extra proof of work (e.g., a photo of a completed gym session).
- **Mobile App Wrapper (PWA):** Allowing users to add Accountability Pods to their phone home screen for quicker access and "app-like" behaviour.
- **Leaderboard Filters:** The ability to filter pod rankings by "All Time," "This Month," or "This Week."
- **Calendar Sync:** Exporting pod deadlines and goal targets to external calendars like Google Calendar or Outlook.
- **Slack/Discord Integration:** Webhooks that post a notification to a specific channel whenever a Group Pod hits a major milestone.
- **Reaction Emojis/Assets:** Ability for buddies to react to check-in "sticky notes" with quick emojis to provide instant feedback.

### Core User Flows

#### Flow 1 – Account Setup

1. Visitor registers a new account
2. User logs in using token authentication
3. User views and updates their profile

#### Flow 2 – Individual Accountability Workflow

1. User creates a personal goal
2. User connects with a verification buddy
3. Buddy accepts or declines the request
4. User submits progress check-ins
5. Buddy reviews and approves or rejects the check-in
6. User views their check-in history and progress

## Technical Implementation

<img width="1500" height="500" alt="APSO (3)" src="https://github.com/user-attachments/assets/059536ef-2fc2-4b72-aec9-0538a3ac0245" />

### Back-End

- Django / DRF API
- Python

### Front-End

- React / JavaScript
- HTML/CSS

### Git & Deployment

- Heroku
- Netlify
- GitHub

This application's back-end will be deployed to Heroku. The front-end will be deployed separately to Netlify.
 
We will also use Insomnia to ensure API endpoints are working smoothly (we will utilise a local and deployed environment in Insomnia).

## Target Audience

This website has one major target audience within a broad age range: individuals who want to be held accountable for their goals, whether professional or personal, by their peers and mentors. Age-range 15-55.

Core Team and Client (administrators) will use this website to manage pod categories, oversee global progress, and manage user roles. 

The administrators will be able to sort, authorise, and delete check-ins and easily download the data in a CSV file. 

This website is targeted towards this group to automate the oversight of multiple accountability groups and streamline data collection for reporting.

Pod Members (laypeople) will use this website to post their progress on a "sticky note" style dashboard, keep track of their personal or group goals, and maintain consistency streaks. 

This website is targeted to this group in order to provide a central, interactive space for digital accountability, preventing the loss of manual tracking data and fostering community motivation.

## Back-end Implementation

<img width="1500" height="500" alt="3" src="https://github.com/user-attachments/assets/1b61fa42-1003-412b-b131-0a6d8750d518" />

## API Specification

### Authentication

| Feature | Access | Notes / Conditions |
| :--- | :--- | :--- |
| Register | Public users | Creates a new user account with username, email, display name, and password |
| Log in | Registered users | Authenticates user and returns token |
| Token authentication | Registered users | Token must be included in protected requests |
| View current user profile | Registered users | Returns details for the authenticated user |
| Update profile | Registered users | Allows user to edit basic profile details such as display name |

| Endpoint | Functionality |
| :--- | :--- |
| POST /api/auth/register/ | Create a new user account |
| POST /api/auth/token/ | Return authentication token for valid credentials |
| GET /api/me/ | Retrieve authenticated user details |
| PATCH /api/me/ | Update authenticated user profile |

### Authentication Notes

| Item | Value |
| :--- | :--- |
| Authentication type | Token authentication |
| Header format | `Authorization: Token <token>` |
| Protected routes | All routes except public registration and login |
| Login input | Username and password |
| Login response | `{ "token": "..." }` |

## Users

| Type | Access | Role type assignment |
| :--- | :--- | :--- |
| Registered User | <br> - Register and log in <br> - Create and manage personal goals <br> - Connect with other users <br> - Assign accountability buddies <br> - Submit and review check-ins <br> - Create and join pods <br> - Comment on goals and pod activity <br> - View and edit their profile | Main platform user |
| Accountability Buddy | <br> - Accept or decline goal assignments <br> - View assigned goals <br> - Approve or reject check-ins <br> - Comment on goal progress | Trusted connection who verifies a user’s progress |
| Pod Member | <br> - Join accountability pods <br> - View pod goals <br> - Submit pod check-ins <br> - Approve or reject pod check-ins <br> - Comment on pod goals and activity | Member of a collaborative accountability pod |

## Connections

| Feature | Access | Notes / Conditions |
| :--- | :--- | :--- |
| Send connection invite | Registered users | Creates a connection request between two users |
| View connections | Registered users | Displays pending and accepted connections |
| Accept connection invite | Invited user | Connection status becomes accepted |
| Decline connection invite | Invited user | Connection request is declined |

| Endpoint | Functionality |
| :--- | :--- |
| GET /connections/ | List all user connections |
| POST /connections/ | Send connection invite |
| POST /connections/{connection_id}/accept/ | Accept connection invite |
| POST /connections/{connection_id}/decline/ | Decline connection invite |


## Individual Goals

| Feature | Access | Notes / Conditions |
| :--- | :--- | :--- |
| Create goal | Registered users | Goal includes title, metric type, target value, and optional dates |
| View goals | Goal owner | Displays all goals created by the user |
| View goal detail | Goal owner and assigned buddies | Shows progress and goal activity |

| Endpoint | Functionality |
| :--- | :--- |
| GET /goals/ | List user goals |
| POST /goals/ | Create a new goal |
| GET /goals/{goal_id}/ | Retrieve goal details |

## Goal Assignments

| Feature | Access | Notes / Conditions |
| :--- | :--- | :--- |
| Assign accountability buddy | Goal owner | Buddy must be a connected user |
| View goal assignments | Goal owner | Displays assigned buddies for a goal |
| Accept assignment | Assigned buddy | Allows buddy to review check-ins |
| Decline assignment | Assigned buddy | Removes assignment request |

| Endpoint | Functionality |
| :--- | :--- |
| GET /goal-assignments/ | List goal assignments |
| GET /goal-assignments/?goal={goal_id} | List assignments for a specific goal |
| POST /goal-assignments/ | Assign buddy to goal |
| POST /goal-assignments/{assignment_id}/accept/ | Accept assignment |
| POST /goal-assignments/{assignment_id}/decline/ | Decline assignment |

## Individual Check-ins

| Feature | Access | Notes / Conditions |
| :--- | :--- | :--- |
| Submit check-in | Goal owner | Records progress toward goal completion |
| View check-ins | Goal owner and assigned buddies | Displays check-in history |
| Approve check-in | Accountability buddy | Confirms progress submitted by goal owner |
| Reject check-in | Accountability buddy | Rejects check-in with optional reason |

| Endpoint | Functionality |
| :--- | :--- |
| GET /checkins/?goal={goal_id} | List check-ins for a goal |
| POST /checkins/ | Submit a check-in |
| POST /checkins/{checkin_id}/approve/ | Approve check-in |
| POST /checkins/{checkin_id}/reject/ | Reject check-in |

## Individual Comments

| Feature | Access | Notes / Conditions |
| :--- | :--- | :--- |
| View comments | Goal owner and assigned buddies | Displays discussion related to a goal |
| Add comment | Goal owner and assigned buddies | Enables encouragement and feedback |

| Endpoint | Functionality |
| :--- | :--- |
| GET /comments/?goal={goal_id} | Retrieve comments for a goal |
| POST /comments/ | Create a new comment |

## Pods

| Feature | Access | Notes / Conditions |
| :--- | :--- | :--- |
| Create pod | Registered users | Pod creator becomes the pod owner |
| View pods | Pod members | Lists pods where the user is a member |
| View pod detail | Pod members | Displays pod information, members, and goals |

| Endpoint | Functionality |
| :--- | :--- |
| GET /pods/ | List pods for the user |
| POST /pods/ | Create a new pod |
| GET /pods/{pod_id}/ | Retrieve pod details |

## Pod Memberships

| Feature | Access | Notes / Conditions |
| :--- | :--- | :--- |
| Invite member to pod | Pod members or owner | Invites another user to join the pod |
| View pod memberships | Pod members | Displays current and pending pod members |
| Accept pod invite | Invited user | Membership status becomes active |
| Decline pod invite | Invited user | Invitation is declined |

| Endpoint | Functionality |
| :--- | :--- |
| GET /pod-memberships/ | List memberships |
| GET /pod-memberships/?pod={pod_id} | List memberships for a specific pod |
| POST /pod-memberships/ | Invite user to pod |
| POST /pod-memberships/{membership_id}/accept/ | Accept pod invitation |
| POST /pod-memberships/{membership_id}/decline/ | Decline pod invitation |

## Pod Goals

| Feature | Access | Notes / Conditions |
| :--- | :--- | :--- |
| Create pod goal | Pod members | Creates a shared goal for the pod |
| View pod goals | Pod members | Displays goals created within the pod |

| Endpoint | Functionality |
| :--- | :--- |
| GET /pod-goals/?pod={pod_id} | List goals for a pod |
| POST /pod-goals/ | Create pod goal |

## Pod Check-ins

| Feature | Access | Notes / Conditions |
| :--- | :--- | :--- |
| Submit pod check-in | Pod members | Records progress toward a pod goal |
| View pod check-ins | Pod members | Displays pod check-in history |
| Approve pod check-in | Pod members (excluding creator) | Verifies another member’s check-in |
| Reject pod check-in | Pod members (excluding creator) | Reject check-in with optional reason |

| Endpoint | Functionality |
| :--- | :--- |
| GET /pod-checkins/?pod_goal={pod_goal_id} | List check-ins for a pod goal |
| POST /pod-checkins/ | Submit pod check-in |
| POST /pod-checkins/{checkin_id}/approve/ | Approve pod check-in |
| POST /pod-checkins/{checkin_id}/reject/ | Reject pod check-in |

## Pod Comments

| Feature | Access | Notes / Conditions |
| :--- | :--- | :--- |
| View pod comments | Pod members | Displays discussion within pod goals |
| Add pod comment | Pod members | Enables feedback and encouragement |

| Endpoint | Functionality |
| :--- | :--- |
| GET /pod-comments/?pod_goal={pod_goal_id} | Retrieve pod comments |
| POST /pod-comments/ | Create pod comment |

## Example API Objects

```json
{
  "user": {
    "user_id": 1,
    "username": "jane_doe",
    "full_name": "Jane Doe",
    "email": "jane@example.com",
    "role_id": 3,
    "avatar": "https://example.com/avatar.jpg",
    "bio": "Aspiring software developer",
    "social_link": "https://github.com/janedoe"
  },
  "category": {
    "category_id": 1,
    "title": "Coding",
    "description": "Pods related to programming and technical study",
    "approver_id": 2,
    "default_goal_duration": "weekly",
    "is_exported": false
  },
  "pod": {
    "pod_id": 10,
    "title": "Python Pioneers",
    "category_id": 1,
    "goal_type": "group",
    "start_date": "2026-03-01T09:00:00Z",
    "end_date": "2026-03-31T23:59:59Z",
    "creator_id": 4
  },
  "goal": {
    "goal_id": 15,
    "pod_id": 10,
    "user_id": 4,
    "title": "Complete 3 Python practice sessions per week",
    "target_value": 3,
    "cadence": "weekly",
    "goal_type": "individual"
  },
  "check_in": {
    "checkin_id": 101,
    "user_id": 4,
    "pod_id": 10,
    "goal_id": 15,
    "value": 1,
    "comment": "Finished one Python practice session today",
    "hashtags": ["#python", "#study"],
    "status": "pending",
    "contribution_type": "individual",
    "created_at": "2026-03-07T10:30:00Z",
    "verified_by": null,
    "is_verified": false
  }
}
```
### Database Schema

> [!IMPORTANT]  
> Please zoom in to see the database details better

<img width="1500" height="500" alt="db1" src="https://github.com/user-attachments/assets/f47c72c8-ee81-43ee-85bb-e66ec864784c" />

<img width="1500" height="500" alt="db2" src="https://github.com/user-attachments/assets/64d4f3f0-cdbe-4017-b61f-5947299d6712" />

## Front-end Implementation

<img width="1500" height="500" alt="4" src="https://github.com/user-attachments/assets/0502cc10-5657-4aa0-917f-38a334205904" />

> [!NOTE]  
> The visual features outlined below are subject to change in response to client feedback, evolving project requirements, or development constraints.

### Wireframes

[Name of screen]
<img width="1500" height="2000" alt="6" src="https://github.com/user-attachments/assets/8843702a-69bf-46cb-abfd-c2969b1b4eba" />
[Add some details later...]

[Name of screen]
<img width="1500" height="2000" alt="7" src="https://github.com/user-attachments/assets/ebccc5d9-d659-4517-938a-11a29444bc14" />
[Add some details later...]

[Name of screen]
<img width="1500" height="2000" alt="8" src="https://github.com/user-attachments/assets/6b96cd5e-6b36-41ec-bf5e-9bbba07189c9" />
[Add some details later...]

[Name of screen]
<img width="1500" height="2000" alt="9" src="https://github.com/user-attachments/assets/6e6af33b-b478-443f-a9e5-dd6fc3cb23fe" />
[Add some details later...]

[Name of screen]
<img width="1500" height="2000" alt="10" src="https://github.com/user-attachments/assets/46e69c2f-6383-49c0-bb1a-46b1baac5e83" />
[Add some details later...]

### Logo
<img width="1500" height="1500" alt="Logo_Pods" src="https://github.com/user-attachments/assets/f7967cec-6647-4aa4-8573-4392bcf027c3" />

### Colours

<img width="1500" height="2000" alt="Primary Colours" src="https://github.com/user-attachments/assets/0062e3b1-1bfb-456e-b150-2cd77ccaa93b" />

<img width="1500" height="2000" alt="Screenshot 2026-03-08 at 6 54 14 pm" src="https://github.com/user-attachments/assets/acd34b01-5d41-45d6-945b-ff2ab7f72ab0" />

<img width="1500" height="2000" alt="Screenshot 2026-03-08 at 6 54 23 pm" src="https://github.com/user-attachments/assets/8262521a-7915-485d-bf37-7544715cf462" />

### Font
We have chosen to work with **Nunito** from Google Fonts.

This is how to import it into our code:

```
<style>
@import url("https://fonts.googleapis.com/css2?family=Nunito:ital,wght@0,200..1000;1,200..1000&display=swap");
</style>
```

**This is what Nunito Font looks like:**
<img width="1500" height="2000" alt="Screenshot 2026-03-08 at 6 16 25 pm" src="https://github.com/user-attachments/assets/f728cd4f-d31f-4c6f-8086-2c6f4da0fb73" />


### Thats All For Now
[Last updated Sunday 8th March 2026]
<img width="1500" height="500" alt="APSO (2)" src="https://github.com/user-attachments/assets/fd652484-84d9-4766-b3a4-059c20d2675d" />

