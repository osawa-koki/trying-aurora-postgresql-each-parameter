import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';

import NetworkStack from './network/network';
import DatabaseStack from './database/database';

export class IndexStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, {
      ...props,
      stackName: process.env.BASE_STACK_NAME!,
    });

    const networkStack = new NetworkStack(this, 'NetworkStack', {
      stackName: `${process.env.BASE_STACK_NAME!}-NetworkStack`,
    });

    const databaseStack = new DatabaseStack(this, 'DatabaseStack', {
      stackName: `${process.env.BASE_STACK_NAME!}-DatabaseStack`,
      vpc: networkStack.vpc,
      dbSubnets: networkStack.publicSubnets, // テスト用であるため、パブリックサブネットに配置
    });
    databaseStack.addDependency(networkStack);
  }
}
