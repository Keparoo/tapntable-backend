# tapntable
A restaurant point of sale system (POS): A web-based POS with a postgresql RESTful backend and React-Redux Frontend

Springboard Capstone 2
---  
## Database Schema  
The current version of the database schema is below. Only the orange tables have been implemented. The blue tables are for phase 2.  

[Database Schema v1.6](tapntable-schema-v1.6.png)

Current issues being worked out related to the schema:

User currently includes these fields:  
* id (primary key)
* password
* pin
* display_name
* first_name
* last_name
* role_id
* is_active

Logging in and out of a typical Restaurant POS is typically different than a standard web app. Access to the POS during a shift needs to be a fast action. The way that it is implemented in every system I've ever seen is by using a PIN. A user "logs in" upon arrival to work by typing in a unique (usually 4 digit) PIN. (No username) This action clocks in the user and enables them to then create orders.

To enter an order, the user enters their pin at a terminal. (A restaurant may have more than one terminal and the result should be the same regardless of which terminal is used.) If the user is clocked-in already, they now see the view showing their current checks if any (and edit them) and allows them to create new checks.

At the end of a shift the server must "cash-out" reconciling their checks and money and then punch out.

Users that don't create orders (cooks for instance) only punch in and out. They would never be shown a view to create a check.

Usually a manager/owner accesses the system from an office computer (usually for viewing/printing reports, adding/editing menu items, adding/editing users etc) in addition to logging into the server/bartender terminals as needed.

Thus, I'm working out some authenitcation questions:
Logging in from an office computer username/password (or in this case id/password) makes sense.

From the server/bartender terminals I'm trying to figure out the best plan. Here are a few possible solutions:

1. The terminals are "set up once" and always have a token to access the database
    * Only access from the office or from another location would require login
    * This is what appears to be happening at most restaurants currently. Sometimes this is a closed system with the database hosted locally, but now more systems use cloud databases.
    * The server/bar terminals are typically always running the software, and auto-boot upon powerup.
    * Users never use the local operating system.
    * Servers/Bartenders simply enter their unique pin to clock-in/create checks
    * Perhaps a token could be refreshed regulary (see option 3)
    * This would be the easiest. Are there potential security issues?
2. The manager logs in to start a day
    * The system generates a new token and stores it locally.
    * Now that the system has been started, employees can access with their pin
    * The employee role will decide the actions of the POS and what they can do
    * It would be helpful if this could be done on one terminal and all server terminals would "logged in"
    * Could cause problems if a user with inadequate access has to start a day
3. When the manager closes a day the token is refreshed and is now ready for the next day
    * This would allow an employee to log in even if a manager hasn't logged in to start the day
  


