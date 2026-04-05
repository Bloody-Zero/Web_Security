docker-compose build

CyberShield Simulator
 1.0.0 
OAS 3.1
/openapi.json
Интерактивный симулятор кибербезопасности

Authorize
auth


POST
/api/auth/register
Register

Parameters
Try it out
No parameters

Request body

application/json
Example Value
Schema
{
  "username": "Qrq3FnUpIqU2KfkJ3PWUQPDTkfe5BpQWDl2Kc6PI6whLFC",
  "email": "user@example.com",
  "password": "stringst"
}
Responses
Code	Description	Links
200	
Successful Response

Media type

application/json
Controls Accept header.
Example Value
Schema
{
  "access_token": "string",
  "token_type": "bearer",
  "user": {
    "id": 0,
    "username": "string",
    "email": "string",
    "reputation": 0,
    "league": "string",
    "created_at": "2026-04-05T02:55:40.873Z"
  }
}
No links
422	
Validation Error

Media type

application/json
Example Value
Schema
{
  "detail": [
    {
      "loc": [
        "string",
        0
      ],
      "msg": "string",
      "type": "string"
    }
  ]
}
No links

POST
/api/auth/login
Login

Parameters
Try it out
No parameters

Request body

application/json
Example Value
Schema
{
  "username": "string",
  "password": "string"
}
Responses
Code	Description	Links
200	
Successful Response

Media type

application/json
Controls Accept header.
Example Value
Schema
{
  "access_token": "string",
  "token_type": "bearer",
  "user": {
    "id": 0,
    "username": "string",
    "email": "string",
    "reputation": 0,
    "league": "string",
    "created_at": "2026-04-05T02:55:40.865Z"
  }
}
No links
422	
Validation Error

Media type

application/json
Example Value
Schema
{
  "detail": [
    {
      "loc": [
        "string",
        0
      ],
      "msg": "string",
      "type": "string"
    }
  ]
}
No links
game


GET
/api/game/scenarios
Get Scenarios

Parameters
Try it out
No parameters

Responses
Code	Description	Links
200	
Successful Response

Media type

application/json
Controls Accept header.
Example Value
Schema
"string"
No links

GET
/api/game/scenario/{scenario_id}
Get Scenario

Parameters
Try it out
Name	Description
scenario_id *
integer
(path)
scenario_id
Responses
Code	Description	Links
200	
Successful Response

Media type

application/json
Controls Accept header.
Example Value
Schema
"string"
No links
422	
Validation Error

Media type

application/json
Example Value
Schema
{
  "detail": [
    {
      "loc": [
        "string",
        0
      ],
      "msg": "string",
      "type": "string"
    }
  ]
}
No links

POST
/api/game/action
Submit Action


Parameters
Try it out
No parameters

Request body

application/json
Example Value
Schema
{
  "scenario_id": 0,
  "choice_id": 0
}
Responses
Code	Description	Links
200	
Successful Response

Media type

application/json
Controls Accept header.
Example Value
Schema
{
  "is_correct": true,
  "feedback": "string",
  "consequence_animation": "string",
  "reputation_change": 0,
  "scenario_completed": true,
  "cwe_info": "string",
  "owasp_info": "string",
  "protection_steps": [
    "string"
  ]
}
No links
422	
Validation Error

Media type

application/json
Example Value
Schema
{
  "detail": [
    {
      "loc": [
        "string",
        0
      ],
      "msg": "string",
      "type": "string"
    }
  ]
}
No links
stats

default


GET
/api/health
Health

Parameters
Try it out
No parameters

Responses
Code	Description	Links
200	
Successful Response

Media type

application/json
Controls Accept header.
Example Value
Schema
"string"
No links

Schemas
ActionRequestExpand allobject
ActionResponseExpand allobject
HTTPValidationErrorCollapse allobject
detailExpand allarray<object>
StatsResponseCollapse allobject
total_scenariosinteger
completed_scenariosinteger
success_ratenumber
total_attemptsinteger
current_reputationinteger
leaguestring
league_progressnumber
scenario_resultsExpand allarray<object>
TokenResponseCollapse allobject
access_tokenstring
token_typeExpand allstring
userExpand allobject
UserCreateCollapse allobject
usernamestring[3, 50] charactersmatches ^[a-zA-Z0-9_-]+$
emailstringemail
passwordstring>= 8 characters
UserLoginCollapse allobject
usernamestring
passwordstring
UserResponseCollapse allobject
idinteger
usernamestring
emailstring
reputationinteger
leaguestring
created_atstringdate-time
ValidationErrorCollapse allobject
locExpand allarray<(string | integer)>
msgstring
typestring
