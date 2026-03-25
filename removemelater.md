# User course progress implementation

Now we are gonna start implementing the user course progress, meaning when a user enrolls in a course, we need to store that information in the database, what tasks did the user complete, where did he stop, etc...


## How to

We will first need to update the user model to include the courses the user is enrolled in storing the courses ids in list.
Note: expiry sistem isnt yet defined, so you can ignore the exchanges between the backend and the frontend about the deadline and expire.

For progress:

- when a user enrolls in a course, a new table user_progress should be created in the database with the following fields:

    CREATE TABLE user_progress (
        user_id UUID NOT NULL,
        course_id VARCHAR(255) NOT NULL,
        progress_data JSONB NOT NULL DEFAULT '{}',
        completed_sections INT[] Defautl '{}',
        total_completed_tasks INT DEFAULT 0,
        is_certified BOOLEAN DEFAULT FALSE,
        updated_at TIMESTAMP DEFAULT NOW(),
        PRIMARY KEY (user_id, course_id)
        deadline TIMESTAMP DEFAULT NULL,
        expired BOOLEAN DEFAULT FALSE,
        renewed_deadline TIMESTAMP DEFAULT NULL,
    );

progress data should be a json in the following format where the number of sections 
depends on each course:

{
  section_1_id: ["task_1", "task_3"],
  section_2_id: ["task_1"]
}


## API Endpoints & services

Now we need to contruct this endpoints so that this data can be acessed.

### Router

Because we changed the user model to include the courses the user is enrolled in, we need to update the org_manager/users router to include the new endpoints.

- Get /users/{user_id} - gets the user and the courses the user is enrolled in this endpoint should allow searching and filtering params
- Post /users/{user_id}/enroll - atributes a course to a user, meaning adds it to the users course_ids list
- Delete /users/{user_id}/unenroll - removes a course from a user, meaning removes it from the users course_ids list


Create a progress.py file in routers and implement the following endpoints:

- Get /users/{user_id}/progress - gets the progress of all courses of a user
- Get /users/{user_id}/progress/{course_id} - gets the progress of a specific course of a user
- Post /users/{user_id}/progress/{course_id} - creates a new progress for a user in a course this should be triggered on enrolment more on that later in the file
- Put /users/{user_id}/progress/{course_id} - updates the progress of a user in a course this should be triggered when the user completes a task
- Post /users/{user_id}/progress/{course_id}/expired - marks a course as expired, this should be triggered when the deadline is reached and the user has not completed the course

### Service

We need now to implement what each endpoint does in the service file.

For the users router:

- Get /users/{user_id} - gets the user and the courses the user is enrolled in
- Post /users/{user_id}/enroll - atributes a course to a user, meaning adds it to the users course_ids list
- Delete /users/{user_id}/unenroll - removes a course from a user, meaning removes it from the users course_ids list

For the progress router:

- Get /users/{user_id}/progress - gets the progress of all courses of a user
- Get /users/{user_id}/progress/{course_id} - gets the progress of a specific course of a user

- Post /users/{user_id}/progress/{course_id} - creates a new progress for a user in a course this should be triggered on enrolment meaning when the org_manager atributes a course to a user, the user should have a deadline to complete the course, this should be set to 30 days from the date of enrolment by default, but it can be changed by the org_manager when atributing the course, if the deadline is reached and the user has not completed the course, the course should be marked as expired and the user should not be able to access it anymore

- Put /users/{user_id}/progress/{course_id} - updates the progress of a user in a course this should be triggered when the user completes a task this endpoint can either add the completed task id to the list in the progress table or add a section id to the completed course list if all tasks in that section are completed, should update the totalcompleted tasks aswell, if a all sections are completed the user should be marked as certified 

- Post /users/{user_id}/progress/{course_id}/expired - marks a course as expired, this should be triggered when the deadline is reached and the user has not completed the course


### Frontend

For the org_manager:

Add to the side bar a new section learning with the following pages:
    - Courses - lists all courses in the platform (view only, reutilize the component from content manager but make the add and edit course dynamic, meaning they should not appear for org_manager)
    - Assign - this page will be the new page explained below

 we will need to create a new page /courses/assign for the manager to atribute a course, this page should envolve a stepper with three phases 

First selecting the given course list,

Second selecting the users that will receive the course (can choose either individual users or by usergroup),

Third selecting the deadline for refreshment and deadline for the users to complete the course , this should be set to 30 days from the date of enrolment by default, but it can be changed by the org_manager when atributing the course, if the deadline is reached and the user has not completed the course, the course should be marked as expired and the user should not be able to access it anymore


You should ADAPT the EXISTING pages to the new design system:
    User /courses page should display courses based on the user's progress, meaning it should display the courses the user is enrolled in and the progress the user has made in each course, filters and search should work similar to the way they do in org_manager
    User /courses/{course_id} page should display the course content and the user's progress in the course and in each module, if a module is completed it should be gray and moved to the bottom of the list
    User /courses/{course_id}/module/{module_id} (Im not sure it is this path, check it) page should display the module content checking if user has progress and after each sucessfull task completion the task should be marked as completed and the progress saved to backend.

