package plugin

import (
	"context"

	"github.com/grafana/grafana-github-datasource/pkg/dfutil"
	"github.com/grafana/grafana-github-datasource/pkg/models"
	"github.com/grafana/grafana-plugin-sdk-go/backend"
)

func (s *Server) handleContributorsQuery(ctx context.Context, q backend.DataQuery) backend.DataResponse {
	query := &models.ContributorsQuery{}
	if err := UnmarshalQuery(q.JSON, query); err != nil {
		return *err
	}
	return dfutil.FrameResponseWithError(s.Datasource.HandleContributorsQuery(ctx, query, q))
}

func (s *Server) HandleContributors(ctx context.Context, req *backend.QueryDataRequest) (*backend.QueryDataResponse, error) {
	return &backend.QueryDataResponse{
		Responses: processQueries(ctx, req, s.handleContributorsQuery),
	}, nil
}
