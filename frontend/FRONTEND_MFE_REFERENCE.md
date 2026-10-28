# 📌 MarkOps Frontend Microservice - Easy Reference Guide

This guide explains **how the frontend microservices work**, **which ports are used**, **how to run everything with 1 command**, and **all the fields used in the Designer module** in simple, everyday English.

---

## 1. Quick Overview: Ports & Services

Instead of running one big app, the frontend is split into small independent apps (called Microfrontends). Each app runs on its own port:

| App Name | Port | What it does | Link |
| :--- | :--- | :--- | :--- |
| **Shell Host App** | **4200** | **Main Door / Container**. Open this in your browser. It shows header, navigation, and loads the MFEs inside. | [http://localhost:4200](http://localhost:4200) |
| **Login App** | **4201** | Handles Login, Email, Password, and Tokens. | [http://localhost:4201](http://localhost:4201) |
| **Designer App** | **4202** | Handles Creative Tasks, Kanban Board, Image/Video uploads, and Approvals. | [http://localhost:4202](http://localhost:4202) |
| **Admin App** | **4203** | Handles Users, Roles, and System Configurations. | [http://localhost:4203](http://localhost:4203) |
| **Digital Marketing App** | **4204** | Handles Campaigns, Ad Sets, Meta Connections, and Lead Telecalling. | [http://localhost:4204](http://localhost:4204) |

👉 **Note:** You only need to open **`http://localhost:4200`** in Chrome. It will automatically load Designer, Admin, and Digital Marketing screens inside it when you click their department cards!

---

## 2. How to Run Everything (1 Command)

Open your terminal inside the `frontend` folder:

### 👉 Run all apps together:
```bash
npm run dev:all
```
* Starts **Port 4200 (Shell)**, **Port 4201 (Login)**, **Port 4202 (Designer)**, **Port 4203 (Admin)**, and **Port 4204 (Digital)** simultaneously!

### If you want to run only one app separately:
```bash
# Run Digital Marketing App (Port 4204)
npm run start:digital

# Run Designer App (Port 4202)
npm run start:designer

# Run Admin App (Port 4203)
npm run start:admin

# Run Login App (Port 4201)
npm run start:login

# Run Shell Host App (Port 4200)
npm run start:shell
```

---

## 3. Designer Module: All Fields Explained Simply

Here is every data field used in the Designer module, what it means, and an example value.

### A. Creative Task (The design job given to the designer)

| Field Name | What it means | Simple Example |
| :--- | :--- | :--- |
| `id` | Unique ID of the task | `101` |
| `title` | Name of the design work | `"Diwali Sale Instagram Banner"` |
| `description` | Extra instructions or details | `"Create a bright festive banner with 20% discount badge"` |
| `campaign_id` | Which campaign this belongs to | `12` |
| `campaign_name` | Campaign name | `"Diwali Festive Offer 2026"` |
| `brand_name` | Client or company brand name | `"MarkOps Store"` |
| `ad_format` | Type of media | `POST`, `REEL`, `STORY`, `CAROUSEL`, `BANNER` |
| `dimensions` | Size of the image/video in pixels | `"1080x1080"` (Square) or `"1080x1920"` (Story/Reel) |
| `target_platform`| Where the ad will run | `INSTAGRAM`, `FACEBOOK`, `GOOGLE_ADS`, `LINKEDIN` |
| `status` | Current step of the work | `TODO` ➔ `IN_PROGRESS` ➔ `IN_REVIEW` ➔ `REVISION` ➔ `COMPLETED` |
| `priority` | How urgent the task is | `LOW`, `MEDIUM`, `HIGH`, `URGENT` |
| `assigned_to` | ID of the designer doing the job | `5` |
| `assignee_full_name` | Name of the designer | `"Arun Kumar"` |
| `created_by` | ID of the manager who created it | `2` |
| `creator_full_name` | Name of the manager | `"Priya Sharma"` |
| `due_date` | Last date to finish | `"2026-10-30T18:00:00Z"` |
| `progress_percent` | Percentage completed | `0` to `100` |
| `headline` | Main heading text to put on design | `"Flat 50% Off This Weekend!"` |
| `ad_copy` | Sub-text or body description | `"Shop the latest summer collection now."` |
| `cta_text` | Text on the button | `"Shop Now"`, `"Learn More"`, `"Sign Up"` |
| `brand_colors` | Colors the designer must use | `["#6366f1", "#ffffff", "#000000"]` |
| `reference_urls` | Example images or links for inspiration | `["https://pin.it/example1", "https://dribbble.com/example2"]` |

---

### B. Submissions & Versions (When designer uploads finished files)

When a designer uploads a file, it creates a new version (v1, v2, v3):

| Field Name | What it means | Simple Example |
| :--- | :--- | :--- |
| `version_id` | Unique ID of this upload | `1` |
| `task_id` | Which task this file belongs to | `101` |
| `version_number` | Version count | `1` (for v1), `2` (for v2) |
| `file_url` | Link to the final image or video | `"/uploads/diwali_banner_v1.png"` |
| `file_name` | Name of the file | `"diwali_banner_v1.png"` |
| `file_type` | File format | `"image/png"`, `"image/jpeg"`, `"video/mp4"` |
| `file_size_mb` | File size in Megabytes | `3.5` (MB) |
| `source_file_url` | Editable file link (Figma / Photoshop) | `"https://figma.com/file/xyz..."` or PSD link |
| `notes` | Message from designer to the reviewer | `"Completed the banner with requested yellow font"` |
| `submitted_by` | Designer User ID | `5` |
| `submitted_at` | Date & time uploaded | `"2026-10-23T14:30:00Z"` |

---

### C. Revisions & Corrections (Client / Manager feedback)

If the manager says "change font color", a revision is created:

| Field Name | What it means | Simple Example |
| :--- | :--- | :--- |
| `revision_id` | Unique ID of this feedback | `4` |
| `task_id` | Task ID | `101` |
| `version_number` | Which version needs correction | `1` (correcting v1) |
| `requested_by` | Manager User ID | `2` |
| `feedback` | What needs to be changed | `"Make the discount badge bigger and change font to white"` |
| `status` | Is it fixed or still open? | `OPEN` or `RESOLVED` |
| `created_at` | When feedback was posted | `"2026-10-23T16:00:00Z"` |

---

### D. Comments & Chat (Discussion between team)

| Field Name | What it means | Simple Example |
| :--- | :--- | :--- |
| `comment_id` | Unique comment ID | `12` |
| `task_id` | Task ID | `101` |
| `user_id` | Sender ID | `5` |
| `user_name` | Name of person who typed | `"Arun Kumar"` |
| `user_role` | Role of sender | `DESIGNER` or `ADMIN` |
| `message` | The chat message | `"Working on the revision now, will upload in 30 mins."` |
| `created_at` | Time of comment | `"2026-10-23T16:15:00Z"` |

---

### E. Dashboard Numbers (KPI Cards on Top of the Page)

These are the summary numbers shown on top of the Designer Dashboard:

| Metric Name | What it shows | Example Number |
| :--- | :--- | :--- |
| `total_tasks` | Total tasks assigned | `14` |
| `todo_tasks` | Tasks waiting to be started | `3` |
| `in_progress_tasks` | Tasks currently being worked on | `5` |
| `in_review_tasks` | Files uploaded, waiting for manager check | `4` |
| `revision_tasks` | Tasks where client asked for corrections | `2` |
| `completed_tasks` | Finished and approved designs | `28` |
| `on_time_rate` | Percentage of tasks finished before deadline | `92%` |

---

## 4. How the Login Token is Shared Between Ports

* You login at **Port 4201**.
* Once login succeeds, it sends the login **JWT token** to the **Shell App (Port 4200)**.
* The Shell App saves the token in `localStorage` under key: `token`.
* When the **Designer App (Port 4202)** needs to fetch tasks from the backend, it reads the same token and sends it in the HTTP header:
  ```http
  Authorization: Bearer <your_jwt_token>
  ```

---

## 5. Summary Cheat Sheet

* **Main Host Port:** `4200`
* **Login Port:** `4201`
* **Designer Port:** `4202`
* **Single Command to start all:** `npm run dev:all`
* **Only work inside:** `Mark-microservies/frontend` (Don't touch backend or root `MarkopsFinal`).

