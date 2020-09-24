import { e2e } from '@grafana/e2e';

// @todo this actually returns type `Cypress.Chainable`
const addGitHubDataSource = (token: string): any => {
  const fillToken = () =>
    e2e()
      .contains('.gf-form', 'Access Token')
      .find('input')
      .scrollIntoView()
      .type(token);

  return e2e.flows.addDataSource({
    checkHealth: true,
    expectedAlertMessage: 'OK',
    form: () => fillToken(),
    type: 'GitHub',
  });
};

interface GitHubPanelConfig {
  owner: string;
  repository: string;
  repositoryVariable: string;
}

const addGitHubPanel = ({ owner, repository, repositoryVariable }: GitHubPanelConfig) => {
  // Assert repository
  e2e.flows.addPanel({
    matchScreenshot: true,
    queriesForm: () => {
      e2e.components.QueryEditorRows.rows().within(() =>
        fillForm({
          owner,
          queryType: 'Pull Requests',
          repository,
          timeField: 'MergedAt',
        })
      );
    },
  }).then(({ config: { panelTitle } }: any) => {
    // Assert annotation and template variable as repository
    e2e.flows.editPanel({
      matchScreenshot: true,
      panelTitle,
      queriesForm: () => {
        fillForm({
          owner,
          queryType: 'Pull Requests',
          repository: `$${repositoryVariable}`,
          timeField: 'MergedAt',
        })
      },
      screenshotName: 'panel-visualization--annotation,variable',
      visitDashboardAtStart: false,
      visualizationName: e2e.flows.VISUALIZATION_GAUGE,
    });
  });
};

interface FillFormConfig {
  displayField?: string;
  owner?: string;
  queryType?: string;
  repository?: string;
  timeField?: string;
}

const fillForm = ({ displayField, owner, queryType, repository, timeField }: FillFormConfig) => {
  if (queryType !== undefined) {
    e2e.flows.selectOption(e2e().contains('.gf-form-inline', 'Query Type'), queryType);
  }

  if (displayField !== undefined) {
    e2e.flows.selectOption(e2e().contains('.gf-form-inline', 'Display Field'), displayField);
  }

  if (owner !== undefined) {
    e2e()
      .get('label:contains(Owner) + * input')
      .clear()
      .type(owner);
  }

  if (repository !== undefined) {
    e2e()
      .get('label:contains(Repository) + * input')
      .clear()
      .type(repository);
  }

  if (timeField !== undefined) {
    e2e.flows.selectOption(e2e().contains('.gf-form-inline', 'Time field'), timeField);
  }
}

e2e.scenario({
  describeName: 'Smoke tests',
  itName: 'Login, create data source, dashboard and panel',
  scenario: () => {
    e2e().readProvisions([
      // Paths are relative to <project-root>/provisioning
      'datasources/github.yaml',
    ]).then(([provision]) => {
      // This gets auto-removed within `afterEach` of @grafana/e2e
      return addGitHubDataSource(provision.datasources[0].secureJsonData.accessToken);
    }).then(({ config: { name: dataSourceName } }: any) => {
      const owner = 'grafana';
      const repository = 'grafana';
      const repositoryVariable = 'repository';

      // This gets auto-removed within `afterEach` of @grafana/e2e
      e2e.flows.addDashboard({
        annotations: [
          {
            dataSource: dataSourceName,
            dataSourceForm: () => {
              e2e().get('annotations-query-ctrl-grafana-github-datasource').within(() =>
                fillForm({
                  displayField: 'published_at',
                  owner,
                  queryType: 'Releases',
                  repository,
                  timeField: 'published_at',
                })
              );
            },
            name: 'Annotations',
          },
        ],
        timeRange: {
          from: '2020-01-01 00:00:00',
          to: '2020-01-31 23:59:59',
        },
        variables: [
          {
            constantValue: repository,
            label: 'Template Variable',
            name: repositoryVariable,
            type: e2e.flows.VARIABLE_TYPE_CONSTANT,
          },
        ],
      });

      // This gets auto-removed within `afterEach` of @grafana/e2e
      addGitHubPanel({
        owner,
        repository,
        repositoryVariable,
      });
    });
  },
});
