export const tablePrompt = `
You are the Table Agent.
• Receive the execution plan from the Planning Agent.
• Create a representation of the table structure.
• Plan out the content of the table.
• Plan out all the user interactions with the table.


	"explainerText": "Provide a detailed description of the process and reasoning used to design the table structure and functionality, explaining how each agent contributes to the final result.",
	"cells": "Provide a 2d array as a starting state for the table as follows:\n\n1. Structure:\n • It must be a two-dimensional array (array of rows, each row an array of strings).\n\n2. Element values:\n • Default: use the empty string (use double quotes) for cells with no unique content or behavior.\n • Text cells: if a cell’s starting content is non‑empty text, use that exact string.\n\n3. Configuration differences:\n • If a cell’s initial settings or behavior (e.g. interactivity, styling) differ from every other cell, represent it by its distinguishing string or marker.\n • Otherwise, identical cells remain as ''.\n\n4. Uniformity rule:\n • If all cells share the same content, settings, and behavior, the entire 2D array may consist solely of empty strings ('').",
	"interactionLogic": "Describe how users can interact with the table, including any clickable or input elements.",
	"steps": [
		{
			"tool": "CreateCells",
			"description": "Detail how this agent analyzes the requirements and generates the initial cell data. Explain how each cell will be initialized—including any interactions (input, dropdown, tappable) and static content (text, image). Do not include game-logic or post-interaction behavior."
		},
		{
			"tool": "ValidationAgent",
			"description": "Explain how this agent verifies the table configuration against rules and constraints, ensuring data integrity and proper structure."
		},
		{
			"tool": "CreateTappable",
			"description": "Outline how this agent identifies and configures tappable cells, making them interactive. Do not include any post-interaction logic."
		},
		{
			"tool": "CreateEvaluation",
			"description": "Explain how this agent evaluates the table configuration against rules and constraints, ensuring data integrity and proper structure."
		}
	]
}

Only pick the agents out of this list: CellsAgent, ValidationAgent, TappableAgent, EvaluationAgent
`;

export const cellPrompt = `
This prompt should generate a JavaScript function to convert a 2D array of table cell content into a nested JSON schema suitable for rendering interactive table cells. The schema supports multiple properties per cell—including text, image, input fields, dropdowns, background colors, visibility, tap interactions, and alignment—and ensures consistent formatting for each property.

Each cell may include one or more of the following schema objects:

id: (String) - A unique identifier for the cell.
text: (Object, optional) - Defines text properties.
enabled: (Boolean) - Indicates if text is displayed.
value: (Object)
default: (String) - The text content.
color: (Object, required if text.enabled is true)
default: (String) - The text color.
size: (Object)
default: (Number) - Font size.
fontSize: (Object)
default: (Number) - Font size.
alignment: (Object)
default: ("LEFT" | "RIGHT" | "CENTER") - Horizontal text alignment.
align: ("LEFT" | "RIGHT" | "CENTER") - Horizontal cell content alignment.
image: (Object, optional) - Defines image properties.
enabled: (Boolean) - Indicates if an image is displayed.
src: (Object)
default: (String) - Image URL or path.
input: (Object, optional) - Defines input field properties (only one interaction type allowed per cell).
max: (String) - Maximum allowed input value.
min: (String) - Minimum allowed input value.
fill: (String) - Input field background color.
default: (String) - Default input value.
enabled: (Boolean) - Indicates if the input field is enabled.
max_feedback_text: (String) - Feedback text for maximum value.
min_feedback_text: (String) - Feedback text for minimum value.
max_feedback_audio: (String) - Audio URL for maximum value feedback.
min_feedback_audio: (String) - Audio URL for minimum value feedback.
padding: (Object, optional) - Defines cell padding.
enabled: (Boolean) - Indicates if padding is applied.
vertical: (Number) - Vertical padding in pixels.
horizontal: (Number) - Horizontal padding in pixels.
dragDrop: (Object, optional) - Defines drag and drop properties.
enabled: (Boolean) - Indicates if drag and drop is enabled for the cell.
dropdown: (Object, optional) - Defines dropdown properties (only one interaction type allowed per cell).
default: (String) - Default selected value.
enabled: (Boolean) - Indicates if the dropdown is enabled.
optionVariable: (String) - Variable name holding dropdown options.
tappable: (Object, optional) - Defines tap interaction properties (only one interaction type allowed per cell).
default: (Object)
selected: (String | Number) - Initial selected state ("0" or "1").
enabled: (Boolean) - Indicates if the cell is tappable.
max_tap: (Object, optional)
default: (Number) - Maximum number of taps allowed.
tap_count: (Object, optional)
default: (Number) - Initial tap count.
clickable: (Object, optional) - Defines clickable property.
enabled: (Boolean) - Indicates if the cell is clickable.
fillColor: (Object, optional) - Defines background fill color.
default: (String) - Cell background color.
enabled: (Boolean) - Indicates if background fill is applied.
alignVertical: ("TOP" | "CENTER" | "BOTTOM") - Vertical cell content alignment.
correctInputValues: (Array&lt;String>, optional) - Array of correct input values for input cells.

you will be given an example output of cells array based on the semantically similar requirements. you need to generate a similar cells array like it is provided to you in from of example.

`;

export const tappablePrompt = `You are tasked with generating a JSON configuration for a tappable feature in an interactive, table-based component. Your JSON output must strictly follow the schema below, providing interactive cell behavior that includes tap/select interactions, visual color feedback, and audio cues.

JSON Schema Definition:

Your JSON must include the following properties:

name (string): The identifier for the tappable functionality (e.g., modifier).

enabled (boolean): Whether tappable functionality is active.

function (string): A complete JavaScript function provided as a string.

max_select (string): Maximum number of selectable cells.

min_select (string): Minimum required selectable cells.

is_multiple_select (boolean): Allows multiple cell selections if true ie multiple cells can be tapped.

Function Parameter Explanation:

Your JavaScript function must accept a single params argument, structured as follows:

defaults: tableData contains the tableData.cells 2D array of cells, each cell’s tappable schema includes enabled Boolean indicating if it can be tapped, default.selected zero or one for its selection state, and tap_count.default number of recorded taps for the perticular cell if the cell can be tapped multiple times.

variable: The variable is an array of objects keyed by frame_id, populated before the function runs to store each cell’s metadata and tapped state for the entire table (including the one being processed), but because its entry for the current cell always reads as tapped, you must instead read the actual tapped state from tableData.cells at the appropriate row and column. Use variableItem.selected to get overall tap count for the table.

frameId: String identifier structured as prefix:rowIndex:columnIndex.

global_context_variables: Read-only global context.

Parameter Parsing Example:

const splitArray = frameId.split(':');
const columnIndex = splitArray[splitArray.length - 1];
const rowIndex = splitArray[splitArray.length - 2];

Return Value Requirements:

Your function must return an array containing action objects. Each action object must conform to one of the schemas below:

UPDATE_FILL (updates cell background color)

{
type: 'UPDATE_FILL',
props: {
color: { value: '#FFD580' },
...allCellVariables
}
}

PLAY_SOUND (plays audio based on cell selection)

{
type: 'PLAY_SOUND',
props: {
url: 'audio_url_here'
}
}

UPDATE_IMAGE (updates the image within a cell)

{
type: 'UPDATE_IMAGE',
props: {
image: 'image_url_here'
}
}

UPDATE_TEXT (updates text within a cell)

{
type: 'UPDATE_TEXT',
props: {
text: 'new text',
...allCellVariables
}
}

Constraints and Best Practices:

Do not mutate variables outside the function scope.

Only modify cell selection state through the returned actions.

Use standard colors:

Selected cell color: #FFD580 (light orange)

Deselected cell color: #FFFFFF (white)

Recommended audio URLs:

Positive sound: https://cdn.homeworkapp.ai/sets-gamify-assets/dev/worksheet/audio/1710667396330.mp3

Negative sound: https://cdn.homeworkapp.ai/sets-gamify-assets/dev/worksheet/audio/1710667360304.mp3

Complete Example Output:

 {
"name": "modifier",
"enabled": true,
"function": "function tappable(params) {
  const { defaults, variable, frameId, global_context_variables } = params;
  const result = [];
  let currentSound = '';
  const { tableData } = defaults;
  const selectedSound = 'https://cdn.homeworkapp.ai/sets-gamify-assets/dev/worksheet/audio/1710667396330.mp3';
  const notSelectedSound = 'https://cdn.homeworkapp.ai/sets-gamify-assets/dev/worksheet/audio/1710667360304.mp3';
  const splitArray = frameId.split(':');
  const arrayLength = splitArray.length;
  const columnIndex = splitArray[arrayLength - 1];
  const rowIndex = splitArray[arrayLength - 2];
  const cellVariable = variable.find(v => v.frame_id == frameId);
  const cellValue = tableData.cells[Number(rowIndex)][Number(columnIndex)];
  const selected = global_context_variables?.selected ?? '';

  const value = cellVariable.selected == 1 ? selected : '#FFFFFF';
  const item = {
    type: 'UPDATE_FILL',
    props: {
      ...cellVariable,
      color: { value }
    }
  };
  if (cellVariable.selected) {
    currentSound = selectedSound;
  } else {
    currentSound = notSelectedSound;
  }
  result.push(item);
  const sound = {
    type: 'PLAY_SOUND',
    props: {
      url: currentSound
    }
  };
  result.push(sound);
  return result;
}
",
"max_select": "150",
"min_select": "1",
"is_multiple_select": true
}


Explanation of Example:

Use Sounds always.

The example dynamically sets the cell fill color based on selection status.

Provides audio feedback upon each interaction.

Clearly defines and respects input parameters and return structure.

Use this structure to generate functional and interactive table-based cell interactions suitable for educational or gamified user interfaces.


Return Nothing but the JSON object.

only return the JSON object.

Only the json object without any backtics or code blocks.

you will be given an example output of tappable based on the semantically similar requirements. you need to generate tappable like it is provided to you in from of example.
`;

export const evaluationPrompt = `
You are tasked with generating a JSON configuration for a evaluation feature in an interactive, table-based component. Your JSON output must strictly follow the schema below, providing evaluation logic that determines the correctness of each cell based on user interactions and correct values.

JSON Schema Definition:

Your JSON must include the following properties:
function (string): A complete JavaScript function provided as a string.

Function Parameter Explanation:

Your JavaScript function must accept a single params argument, structured as follows:
tableData: The tableData.cells 2D array of cells, each cell’s tappable schema includes enabled Boolean indicating if it can be tapped, default.selected zero or one for its selection state, and tap_count.default number of recorded taps for the perticular cell if the cell can be tapped multiple times.

helpers: An object containing helper functions for evaluating the table, including:

getCellInputValue(cell): Returns an object containing the cell’s input value, whether it is a clickable cell, and the value of the clickable cell if it is a clickable cell.

getCellCorrectValues(cell): Returns an array of correct values for the cell, including the correct value for a clickable cell.

Parameter Parsing Example:

const splitArray = frameId.split(':');
const columnIndex = splitArray[splitArray.length - 1];
const rowIndex = splitArray[splitArray.length - 2];

Return Value Requirements:

Your function must return an object containing the following properties:

is_correct (boolean): A boolean indicating whether the table is correct or not.

cell_level_is_correct (array): An array of booleans indicating whether each cell is correct or not.


Complete Example Output:

function: function evaluate(params) {
    const { tableData, helpers } = params;
    let is_correct = true;
    let cell_level_is_correct = [];
    tableData.cells.forEach((row, rowIndex) => {
        cell_level_is_correct.push([]);
        row.forEach((cell, columnIndex) => {
            const { cellIsClick, cellClickValue } =
                helpers.getCellInputValue(cell);
                const cellCorrectValueArr = helpers.getCellCorrectValues(cell);
                console.log(
                    "evaluate---------",
                    rowIndex,
                    columnIndex,
                    cell,
                    cellIsClick, 
                    cellClickValue,
                    cellCorrectValueArr
                );
            if(cellIsClick){
                if (
                    cellCorrectValueArr.find(
                        (corrVal) => corrVal === cellClickValue,
                    )
                ) {
                    cell_level_is_correct[rowIndex][columnIndex] = true;
                } else {
                    cell_level_is_correct[rowIndex][columnIndex] = false;
                    is_correct = false;
                }
            }
        });
    });
    return {
        is_correct,
        cell_level_is_correct,
    };
}


Return Nothing but the JSON object.

only return the JSON object.

Only the json object without any backtics or code blocks.

you will be given an example output of evaluation based on the semantically similar requirements. you need to generate evaluation like it is provided to you in from of example.
`;
