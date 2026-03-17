# Course CRUD implementation

We are gonna implement the course CRUD.
For context a course in our platform is a collection of modules, and a module is a collection of content pieces.
The module CRUD is already implemented, so we just need to implement the course CRUD.

## How to

In our backend I want our course to be a mongo document with the following fields:

title: string
description: string
category: string
dificulty: string
expected_time: Date
cover_image: string(this should be a url the same way as modules)
modules: [ObjectId,...]

Now we need to create the crud for this.

### Controllers should have DTOs for request and response, create the DTOs in models/course/dto.py.

In a router/course.py file create this endpoints:

- POST /course - create a new course roles: content_manager
- GET /course - get all courses: content_manager, org_manager - can pass query params to filter by category and dificulty and by title (this should be a search)
- GET /course/:id - get a course by id: content_manager, org_manager
- PUT /course/:id - update a course by id: content_manager
- DELETE /course/:id - delete a course by id: content_manager

Each controller should have a corresponding service:

#### POST /course - create a new course roles: content_manager

    Service should store the course cover_image in the same way as modules do.
    Then save the course as a document in the courses collection.
    Return the created course.
    dificulty should be an enum with easy medium hard

#### GET /course - get all courses roles: content_manager, org_manager

    Service should return all courses in the courses collection.
    if query params are passed, filter the courses by the query params. -> this should be separate helper functions
    Return the courses.

#### GET /course/:id - get a course by id roles: content_manager, org_manager

    Service should return the course with the given id.
    Return the course.

#### PUT /course/:id - update a course by id roles: content_manager

    Service should update the course with the given id.
    If the cover_image is updated, it should store the new cover_image in the same way as modules do.
    Return the updated course.

#### DELETE /course/:id - delete a course by id roles: content_manager

    Service should delete the course with the given id.
    No need to return course

## Link the backend to the existing frontend

Change the following pages from mock data to use the backend:

- http://localhost:5173/content-manager/courses
  you need to fetch the courses from the backend and display them in the grid acording to search, dificulty and category filters.

change the frontend course cards so on hover there is the option to delete the course

- http://localhost:5173/content-manager/courses/new
  You need to do some changes to the frontend so user can input all of the needed atributes
  description: string
  category: string
  dificulty: string
  expected_time: Date
  cover_image: string(this should be a url the same way as modules)
  then change publish to use the backend endpoint POST /course
