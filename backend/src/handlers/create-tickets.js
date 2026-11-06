
const GITHUB_API = "https://api.github.com/graphql";

const PROJECT_ID = "PVT_kwHODmpth84Bp8lO";
const REPOSITORY_OWNER = "ameyPending08";
const REPOSITORY_NAME = "Backend-Update-1.1";

async function githubRequest(query, variables, token) {
  const response = await fetch(GITHUB_API, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "User-Agent": "senior-project-ticket-tracker"
    },
    body: JSON.stringify({ query, variables })
  });

  const result = await response.json();

  if (!response.ok || result.errors) {
    console.error("GitHub API error:", {
      status: response.status,
      message: result.message,
      errors: result.errors
    });

    throw new Error("GitHub API request failed");
  }

  return result.data;
}

exports.handler = async (event) => {
  const token = process.env.GITHUB_TOKEN;

  if (!token) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "GitHub token not configured" })
    };
  }

  let requestBody;

  try {
    requestBody = typeof event.body === "string"
      ? JSON.parse(event.body)
      : event.body ?? event;

    const title = requestBody.title?.trim();
    const description = requestBody.description?.trim();

    if (!title || !description) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: "Title and description are required"
        })
      };
    }

    // Step 1: Find the GitHub repository ID.
    const repoQuery = `
      query ($owner: String!, $name: String!) {
        repository(owner: $owner, name: $name) {
          id
        }
      }
    `;

    const repoData = await githubRequest(
      repoQuery,
      {
        owner: REPOSITORY_OWNER,
        name: REPOSITORY_NAME
      },
      token
    );

    const repositoryId = repoData.repository?.id;

    if (!repositoryId) {
      throw new Error("GitHub repository not found");
    }

    // Step 2: Create a GitHub Issue.
    const createIssueMutation = `
      mutation ($repositoryId: ID!, $title: String!, $body: String!) {
        createIssue(input: {
          repositoryId: $repositoryId,
          title: $title,
          body: $body
        }) {
          issue {
            id
            number
            title
            url
          }
        }
      }
    `;

    const issueData = await githubRequest(
      createIssueMutation,
      {
        repositoryId,
        title,
        body: description
      },
      token
    );

    const issue = issueData.createIssue.issue;

    // Step 3: Add the issue to your Project board.
    const addToProjectMutation = `
      mutation ($projectId: ID!, $contentId: ID!) {
        addProjectV2ItemById(input: {
          projectId: $projectId,
          contentId: $contentId
        }) {
          item {
            id
          }
        }
      }
    `;

    const projectData = await githubRequest(
      addToProjectMutation,
      {
        projectId: PROJECT_ID,
        contentId: issue.id
      },
      token
    );

    return {
      statusCode: 201,
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        message: "Ticket created successfully",
        issue: {
          number: issue.number,
          title: issue.title,
          url: issue.url
        },
        projectItemId: projectData.addProjectV2ItemById.item.id
      })
    };

  } catch (error) {
    console.error("Create ticket failed:", error);

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Failed to create ticket"
      })
    };
  }
};
