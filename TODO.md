# TODO

- [x] Create github repo for nextjs project
- [ ] Import project into Vercel
- [x] Write transform to create db with test users
  - [x] users collection, indexes
- [ ] auth0 app for react and m2m
- [ ] frontend auth lock React hook and auth0 signin flow integration
- [ ] token.ts lambda to verify auth0 login and create user object in db
  - [ ] verify user is logged in (auth0 check Bearer auth token using auth api, /userinfo)
  - [ ] If user is not logged in, respond with error or redirect to login
  - [ ] If user does not exist in fauna, add user to users table
  - [ ] Use Fauna Login function to generate a new client token
  - [ ] Use Auth0 M2M key to access management api and set client token in app_metadata (management api, PATCH /api/v2/users/{id})
  - [ ] Respond with success
