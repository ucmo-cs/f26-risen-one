
const PROJECT_ID = "PVT_kwHODmpth84Bp8lO";

exports.handler = async () => {
  const token = process.env.GITHUB_TOKEN;

  if (!token) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "GitHub token is not configured"
      })
    };
  }

  const query = `
    query ($projectId: ID!) {
      node(id: $projectId) {
        ... on ProjectV2 {
          title
          items(first: 20) {
            nodes {
              id
              content {
                ... on Issue {
                  number
                  title
                  url
                }
              }
              fieldValueByName(name: "Status") {
                ... on ProjectV2ItemFieldSingleSelectValue {
                  name
                }
              }
            }
          }
        }
      }
    }
  `;

  try {
    const response = await fetch(
      "https://api.github.com/graphql",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          "User-Agent": "senior-project-ticket-tracker"
        },
        body: JSON.stringify({
          query,
          variables: { projectId: PROJECT_ID }
        })
      }
    );

    const result = await response.json();

    if (!response.ok || result.errors) {
      console.error("GitHub API error:", result.errors);

      return {
        statusCode: 502,
        body: JSON.stringify({
          error: "Failed to retrieve GitHub tickets"
        })
      };
    }

    const project = result.data?.node;

    if (!project) {
      return {
        statusCode: 404,
        body: JSON.stringify({
          error: "GitHub project not found"
        })
      };
    }

    const tickets = project.items.nodes
      .filter(item => item.content?.number)
      .map(item => ({
        id: item.id,
        number: item.content.number,
        title: item.content.title,
        url: item.content.url,
        status: item.fieldValueByName?.name ?? "No Status"
      }));

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        project: project.title,
        tickets
      })
    };

  } catch (error) {
    console.error("Read tickets failed:", error);

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Unexpected error retrieving tickets"
      })
    };
  }
};
