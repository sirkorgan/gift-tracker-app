# TODO

- [x] Create github repo for nextjs project
- [x] Import project into Vercel
- [x] Write transform to create db with test users
  - [x] users collection, indexes
- [x] auth0 app for react and m2m - https://www.npmjs.com/package/@auth0/nextjs-auth0
- [x] copy support utils from auth0 example app (withAuth, urlHelper, etc)
- [x] add fauna user login flow to auth0 callback
  - [x] find user query
  - [x] create user query
  - [x] login user query
- [ ] add fauna logout to auth0 logout
  - [ ] logout user query
- [ ] if fauna token is invalid, logout user (allows logging out users by deleting issued tokens)
- [ ] add fauna data test query profile page
- [ ] Fix auth0 redirect uri to work propertly with preview branches
- [ ] Enumerate use-cases
- [ ] Design data model
  - [ ] domain model
  - [ ] db user role and permissions
- [ ] integrate cypress for e2e testing
- [ ] github actions to run cypress tests on preview branches
- [ ] trello project to track bugs and feature backlog

# Use cases

- [ ] change username
- [ ] create occasion
- [ ] view created occasions
- [ ] invite other users to occasion
  - [ ] provide signup link
  - [ ] invite users by username (UserName#1234)
- [ ] view occasion invitations
- [ ] view joined occasions
- [ ] suggest gifts for yourself for an occasion
- [ ] suggest gifts for others for an occasion
- [ ] claim gift suggestions so that others can avoid double-gifting
