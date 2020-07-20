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
- [ ] auth0 integration
  - [ ] add fauna logout to auth0 logout
  - [ ] logout user query
  - [ ] if fauna token is invalid, logout user (allows logging out users by deleting issued tokens)
  - [ ] Fix auth0 redirect uri to work propertly with preview branches
- [ ] Design data model
  - [ ] Enumerate use-cases
  - [x] domain model
  - [ ] db user role and permissions
  - [ ] design data such that permissions enforce domain constraints and reduce need for backend lambdas (silo private, read-only and read-write data)
- [ ] backend development and testing strategy
  - [x] replace faunadb-transform so that we are not tied to node v12.16
  - [x] use node v13.9+ and ts-esnode to enable backend test harness to run ts modules - NOT SATISFACTORY
  - [ ] setup a jest config specifically for the backend api testing and use that instead of custom harness
  - [ ] development database; modify updatedb script to accept a target key and to be used as a module
  - [ ] custom test harness
    - [ ] shortcuts for creating/reseting/deleting development database
    - [ ] system to call faunadb queries and make assertions on the result
- [ ] frontend development and testing strategy
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