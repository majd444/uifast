# UIFast Deployment Instructions for Sevalla

## Database Integration

Your UIFast project has been successfully updated to use a database for token storage. The local development environment uses SQLite, while the production environment on Sevalla will use PostgreSQL.

### What's Been Done

1. **Database Integration**: We've implemented token storage for OAuth credentials using:
   - SQLite for local development (already working)
   - PostgreSQL support for Sevalla deployment

2. **Environment Variables**: Your `.env` file has been updated with the PostgreSQL credentials from Sevalla:
   ```
   DATABASE_URL=postgres://panther:vU5+nT0+qI6+lX0+uL0_@blind-blue-aphid-d57t0-postgresql.blind-blue-aphid-d57t0.svc.cluster.local:5432/blind-blue-aphid
   database_password=vU5+nT0+qI6+lX0+uL0_
   database_username=panther
   database_host=blind-blue-aphid-d57t0-postgresql.blind-blue-aphid-d57t0.svc.cluster.local
   database_port=5432
   database_name=blind-blue-aphid
   ```

3. **Code Updates**: The MCP server has been updated to:
   - Handle both SQLite and PostgreSQL connections
   - Gracefully fall back to SQLite if PostgreSQL is not available
   - Use the correct SQL syntax for each database type

### Deployment Steps

1. **Update requirements.txt**: Before deploying to Sevalla, uncomment the psycopg2-binary line in requirements.txt:
   ```
   # psycopg2-binary is only needed for production deployment
   # It's commented out for local development to avoid installation issues
   psycopg2-binary==2.9.9
   ```

2. **Add Environment Variables in Sevalla**:
   - Make sure all the database credentials are added to your Sevalla app's environment variables
   - The DATABASE_URL should be in the format: `postgres://username:password@hostname:port/database_name`

3. **Deploy to Sevalla**:
   ```
   git add .
   git commit -m "Add database integration for token storage"
   git push
   ```

4. **Test the Database Connection**:
   - After deployment, access the `/test-db` endpoint to verify the PostgreSQL connection
   - You should see a success message with database information

### Testing

The local SQLite database is already working as confirmed by the test script. When deployed to Sevalla, the MCP server will automatically use PostgreSQL if available.

### Additional Recommendations

1. **Token Refresh**: Consider implementing token refresh logic to handle expired OAuth tokens
2. **Error Handling**: Add more robust error handling for database operations in production
3. **Monitoring**: Set up monitoring for database connections and token usage
