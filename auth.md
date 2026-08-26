# BolKhata — Supabase Auth Implementation

You are a **senior full-stack engineer** working inside my existing **BolKhata** application.

## Context

* I want to implement **Supabase Authentication** in the existing application.
* **Supabase MCP is already connected** and available.
* Coding model: **Gemini 3.1 Pro in Antigravity**.
* Do not unnecessarily restructure or rewrite the existing application.
* First inspect the existing codebase, architecture, routing, UI theme, logo, and current authentication-related code.

---

## 1. Create Feature Branch

Before making any code changes, create and switch to:

```bash
git checkout -b feature/auth-implementation
```

All authentication changes must be implemented on this branch.

---

## 2. Inspect the Existing Application

Before implementing anything:

* Identify the frontend framework and routing system.
* Identify the current dashboard/application route.
* Locate the existing **BolKhata logo**.
* Understand the current UI design system and theme.
* Check whether authentication logic already exists.
* Check existing environment-variable conventions.
* Inspect the existing component structure.
* Use the connected **Supabase MCP** where appropriate to inspect/configure the Supabase project.

Do not create duplicate infrastructure if something already exists.

---

# 3. Implement Supabase Authentication

Implement production-ready **Supabase Auth** using the existing project's architecture.

Required functionality:

* [ ] User signup
* [ ] User login
* [ ] User logout
* [ ] Session persistence
* [ ] Auth state handling
* [ ] Protected dashboard/application routes
* [ ] Redirect unauthenticated users to the auth page
* [ ] Redirect authenticated users to the dashboard
* [ ] Loading states
* [ ] Authentication error handling
* [ ] Form validation

Use the appropriate official Supabase client/library for the existing framework.

### Security

* Never hardcode Supabase credentials.
* Use environment variables.
* Follow the project's existing `.env` conventions.
* Never expose secret/service-role credentials in frontend code.

---

# 4. Initial Logo Animation

When the application initially loads, show the **BolKhata logo animation first**, then display the authentication page.

### Flow

```text
Application Load
      ↓
BolKhata Logo Animation
      ↓
Login / Signup Page
```

### Requirements

* Use the existing BolKhata logo.
* Keep the animation short and professional.
* Use a smooth fade/scale or similar subtle animation.
* Avoid unnecessarily long splash screens.
* Match the existing BolKhata visual identity.

---

# 5. Login / Signup Page

Create an attractive, modern, and simple authentication page that matches the existing **BolKhata theme**.

The authentication UI should feel like a natural part of the application rather than a separate template.

### Login

Include:

* Email input
* Password input
* Show/hide password
* Login button
* Loading state
* Error messages
* Link/button to switch to Signup

### Signup

Include:

* Email input
* Password input
* Confirm password if appropriate
* Signup button
* Loading state
* Validation errors
* Authentication errors
* Link/button to switch to Login

### UI Requirements

* Clean
* Modern
* Minimal
* Attractive
* Responsive
* Mobile-friendly
* Accessible
* Consistent with BolKhata branding
* Good spacing and typography
* Clear CTA
* Smooth but subtle interactions

**Do not introduce a completely different design system.**

First inspect the existing BolKhata UI and reuse its colors, typography, spacing, components, and visual language wherever possible.

---

# 6. Successful Authentication Flow

After a successful **login or signup**, do not immediately open the dashboard.

Play the BolKhata logo animation again.

### Flow

```text
Successful Login / Signup
          ↓
BolKhata Logo Animation
          ↓
Dashboard
```

The animation should be short enough that it does not feel like unnecessary waiting.

---

# 7. Route Protection

Implement proper authentication protection according to the existing framework.

Expected behavior:

```text
                 Application
                      ↓
              Logo Animation
                      ↓
               Authenticated?
                /          \
              YES           NO
               ↓             ↓
          Dashboard     Login / Signup
```

### Required behavior

#### Unauthenticated user

If the user manually visits:

```text
/dashboard
```

or any protected application route:

```text
Protected Route
      ↓
Not authenticated
      ↓
Login / Signup
```

#### Authenticated user

If an authenticated user visits the login/signup page:

```text
Login / Signup
      ↓
Already authenticated
      ↓
Dashboard
```

---

# 8. Session Handling

Ensure Supabase sessions work correctly.

Test that:

* Authentication persists after page refresh.
* User remains logged in when reopening the application.
* Logout properly clears the session.
* Auth state changes are handled correctly.
* Protected routes react correctly when authentication state changes.

Avoid unnecessary client-side hacks for authentication state.

---

# 9. Error Handling

Handle Supabase errors gracefully.

Examples:

* Invalid email
* Invalid password
* Incorrect credentials
* Existing account
* Weak password
* Network errors
* Session errors
* Signup errors

Do not expose raw technical errors directly to users.

Convert them into clean, understandable messages where appropriate.

---

# 10. Loading States

Provide proper loading states for:

* Initial authentication check
* Login
* Signup
* Logout
* Logo animation
* Dashboard redirect

Avoid flashing the login page while Supabase is still determining whether the user has an active session.

---

# 11. Do Not Break Existing Application

Important:

**Do not rewrite the existing application.**

Preserve:

* Existing dashboard
* Existing components
* Existing API functionality
* Existing database logic
* Existing UI
* Existing project structure

Only modify what is necessary to introduce authentication and the required auth flow.

Avoid unnecessary dependencies.

---

# 12. Testing

After implementation, actually run and test the application.

### Test Checklist

* [ ] Project starts successfully
* [ ] No TypeScript errors
* [ ] No build errors
* [ ] No lint errors where applicable
* [ ] Initial logo animation works
* [ ] Login page renders correctly
* [ ] Signup works
* [ ] Login works
* [ ] Logout works
* [ ] Session persists after refresh
* [ ] Unauthenticated users cannot access dashboard
* [ ] Authenticated users are redirected away from login
* [ ] Post-login logo animation works
* [ ] Post-signup logo animation works
* [ ] Dashboard opens after animation
* [ ] Mobile UI works
* [ ] Desktop UI works
* [ ] Existing application functionality still works

If you discover errors during testing, **fix them instead of only reporting them**.

---

# 13. Supabase Configuration

Use the connected **Supabase MCP** to determine what configuration is required.

If Supabase dashboard configuration is required, clearly identify it.

Check things such as:

* Authentication provider configuration
* Email authentication
* Redirect URLs
* Site URL
* Required environment variables
* Any required database/auth configuration

Do not invent configuration values.

---

# 14. Final Report

After implementation, provide a concise final report containing:

### Changed Files

List all files created or modified.

### Authentication

Explain what authentication functionality was implemented.

### Environment Variables

List the required environment variables, without exposing any secret values.

### Supabase Configuration

Mention any configuration that must be completed in Supabase.

### Testing

Mention which authentication flows were tested successfully.

### Remaining Issues

Clearly mention anything that could not be completed or requires manual action.

---

# Important Development Rules

Follow this workflow:

```text
Inspect
   ↓
Understand Existing Architecture
   ↓
Create feature/auth-implementation
   ↓
Plan Auth Integration
   ↓
Implement Supabase Auth
   ↓
Implement Logo Animation
   ↓
Implement Login / Signup UI
   ↓
Implement Route Protection
   ↓
Test
   ↓
Fix Issues
   ↓
Final Verification
```

### Critical Rules

1. **Do not blindly rewrite existing code.**
2. **Reuse existing BolKhata components and styling where possible.**
3. **Use Supabase MCP instead of guessing Supabase configuration.**
4. **Never hardcode credentials or secrets.**
5. **Do not add unnecessary dependencies.**
6. **Keep animations short and professional.**
7. **Do not show the dashboard before authentication is verified.**
8. **Do not leave broken or untested code.**
9. **Fix errors discovered during implementation.**
10. **Keep the implementation production-ready but simple.**

The final result should feel like **BolKhata's native authentication experience**, not a generic Supabase login template.
