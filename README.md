# InternTrack UiTM – Internship Placement System

## Project description
InternTrack UiTM is a front-end prototype that allows UiTM students to submit internship placement requests and allows UiTM administrators to review, approve, or reject those requests.

## Main features
### Student
- Register and log in as a student.
- Submit an internship placement application.
- Select a preferred UiTM department/unit.
- Enter internship duration and start/end dates.
- View application status and admin comments.

### Administrator
- Separate administrator login.
- View all student applications.
- Search applications and filter by status.
- Review student details and preferred department.
- Approve or reject applications.
- Confirm or change the final placement department.
- Add a comment for the student.
- View application summary counts.

## Demo login
- Student: `student@uitm.edu.my` / `student123`
- Admin: `admin@uitm.edu.my` / `admin123`

## Technologies
- HTML5
- CSS3
- Bootstrap 5.3.3
- Bootstrap Icons
- JavaScript
- Browser localStorage

## How to run
1. Extract the ZIP file.
2. Open the `InternTrack_UiTM` folder in Visual Studio Code.
3. Open `index.html` with Live Server.
4. Sign in using one of the demo accounts above.

## Notes and limitations
This is an academic front-end prototype. Data is stored in the browser's localStorage, so it is not a real multi-user online database. Student and admin data created in one browser profile are visible only in that same browser profile. Demo passwords are not secure and must not be used for a real deployment. A production system requires a secure backend, database, authentication, and access control.

## GitHub Pages
Upload the project files to a GitHub repository. Enable GitHub Pages from the repository's Settings > Pages. Since this prototype uses localStorage, the demo works in a single browser profile and does not synchronize between different users or devices.
