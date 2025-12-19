import 'package:flutter/material.dart';
import 'package:pharma_care/core/constants/app_colors.dart';

class ActivityFeed extends StatelessWidget {
  const ActivityFeed({super.key});

  @override
  Widget build(BuildContext context) {
    // TODO: Replace with actual activity data from API
    final activities = <Map<String, String>>[];

    if (activities.isEmpty) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(32.0),
          child: Column(
            children: [
              Icon(
                Icons.history,
                size: 48,
                color: AppColors.textTertiary,
              ),
              const SizedBox(height: 16),
              Text(
                'No recent activity',
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: AppColors.textSecondary,
                    ),
              ),
            ],
          ),
        ),
      );
    }

    return ListView.separated(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      itemCount: activities.length,
      separatorBuilder: (context, index) => const Divider(),
      itemBuilder: (context, index) {
        final activity = activities[index];
        return ListTile(
          leading: CircleAvatar(
            backgroundColor: AppColors.primary.withValues(alpha: 0.1),
            child: Icon(
              Icons.medication,
              color: AppColors.primary,
              size: 20,
            ),
          ),
          title: Text(activity['title'] ?? ''),
          subtitle: Text(activity['time'] ?? ''),
          trailing: Icon(
            Icons.chevron_right,
            color: AppColors.textTertiary,
          ),
        );
      },
    );
  }
}
