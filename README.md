# Mega Prompts
App with drill down UI style buttons which reveal more buttons for detailed scope requirements of any given software project for an Ai to build.

More clicking less typing for users to make their selections about what they want to build.

Output is a structured json format that is a lengthy highly detailed prompt that can be accessed with curl so that any other coding Ai can access and use for its generation.

Whole point is to alleviate the user from the burden of having to think of and then write type out or speak out loud a length and complex project requirements document / project scope / prompt for their Ai coding model of choice.

Self guided process of step by step selection of project requirements to generate a highly detailed prompt that can be accessed with curl so that any other coding Ai can access and use for its generation and can easily be shared with others.

Also include a input fields or text areas for the user to add their own custom requirements but categorized and structured in a way that makes sense to the user.

Expect users to make web apps, mobile apps, desktop software, games, tools, etc. The sky's the limit not just websites, but must be digital format since its intended for an Ai to build.

# Tech Stack
- TypeScript
- React
- Tailwind CSS
- Vite

# Public Accessible API Endpoints
/mp/:id Returns a json object of a prompt

Prompt output UUID is used to access the specific prompt. All prompts are stored in a database and can be accessed by any anyone that curls the /mp/:id endpoint.

# Design Theme
- Simple clean modern UI
- Dark mode optional
- Responsive
- Mobile first
- Simple clean easy to use interface of nice looking buttons and checkboxes that are easy to understand and add to a sort of shopping cart style interface of line items that are added so the user knows what they can expect.


# Integrations
Integration with https://json-render.dev/ (https://github.com/vercel-labs/json-render) to render the json output of the prompts instantly.

# Constraints
- Uses locally hosted Ollama models for Ai generation of prompts as the user defined selections narrows down the scope the project with predefined details and constraints added to the "mega prompt" which is then sent to the Ollama Ai model to generate the final prompt.
- Uses free open source software only, no paid services at all.
