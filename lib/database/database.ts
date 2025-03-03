import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as rds from 'aws-cdk-lib/aws-rds';
import { Construct } from 'constructs';

interface DatabaseStackProps extends cdk.StackProps {
  stackName: string;
  vpc: ec2.Vpc;
  dbSubnets: ec2.SelectedSubnets;
}

export default class DatabaseStack extends cdk.Stack {
  public readonly aurora: rds.DatabaseCluster;

  constructor(scope: Construct, id: string, props: DatabaseStackProps) {
    const { stackName, vpc, dbSubnets } = props;

    super(scope, id, {
      ...props,
      stackName,
    });

     // テスト用であるため、パブリックサブネットに配置
    const dbSecurityGroup = new ec2.SecurityGroup(this, 'DatabaseSecurityGroup', {
      vpc,
      description: 'Security group for Aurora database',
      allowAllOutbound: true,
    });
    dbSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(5432),
      'Allow all incoming PostgreSQL traffic'
    );

    const dbParameterGroup = new rds.ParameterGroup(this, 'AuroraParameterGroup', {
      engine: rds.DatabaseClusterEngine.auroraPostgres({
        version: rds.AuroraPostgresEngineVersion.VER_15_4
      }),
      description: 'Custom parameter group for Aurora PostgreSQL 15.4',
      parameters: {}
    });

    const aurora = new rds.DatabaseCluster(this, 'MyAurora', {
      engine: rds.DatabaseClusterEngine.auroraPostgres({
        version: rds.AuroraPostgresEngineVersion.VER_15_4
      }),
      vpc,
      vpcSubnets: dbSubnets,
      securityGroups: [dbSecurityGroup],
      parameterGroup: dbParameterGroup,
      credentials: rds.Credentials.fromGeneratedSecret(process.env.AURORA_USERNAME!, {
        secretName: process.env.AURORA_CREDENTIALS_SECRET_NAME!,
      }),
      deletionProtection: false,
      defaultDatabaseName: process.env.AURORA_DATABASE_NAME!,
      writer: rds.ClusterInstance.provisioned("Writer", {
        instanceType: ec2.InstanceType.of(
          ec2.InstanceClass.T3,
          ec2.InstanceSize.MEDIUM
        ),
        publiclyAccessible: true, // テスト用であるため、パブリックサブネットに配置
        instanceIdentifier: "db-writer",
      }),
      readers: [],
    });

    this.aurora = aurora;
  }
}
